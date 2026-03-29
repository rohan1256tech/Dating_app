import {
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { MessageService } from './message.service';

@Injectable()
export class ChatGateway {
    server: Server;
    private readonly logger = new Logger(ChatGateway.name);

    // Track connected users: userId -> Set of socketIds
    private connectedUsers = new Map<string, Set<string>>();
    // Track socket -> userId mapping
    private socketUserMap = new Map<string, string>();

    constructor(
        private readonly messageService: MessageService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    setServer(io: Server) {
        this.server = io;

        this.server.on('connection', async (socket) => {
            await this.handleConnection(socket);

            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });

            socket.on('joinRoom', async (data, callback) => {
                const res = await this.handleJoinRoom(socket, data);
                if (callback && res) callback(res);
            });

            socket.on('leaveRoom', async (data, callback) => {
                const res = await this.handleLeaveRoom(socket, data);
                if (callback && res) callback(res);
            });

            socket.on('sendMessage', async (data, callback) => {
                const res = await this.handleSendMessage(socket, data);
                if (callback && res) callback(res);
            });

            socket.on('typing', async (data) => {
                await this.handleTyping(socket, data);
            });

            socket.on('markRead', async (data, callback) => {
                const res = await this.handleMarkRead(socket, data);
                if (callback && res) callback(res);
            });
        });

        this.logger.log('🚀 Native Socket.IO Server successfully bound in ChatGateway!');
    }

    /**
     * Authenticate socket connection via JWT in handshake
     */
    async handleConnection(client: Socket) {
        try {
            const token =
                client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');

            if (!token) {
                this.logger.warn(`Socket ${client.id}: No auth token provided`);
                client.emit('error', { message: 'Authentication required' });
                client.disconnect();
                return;
            }

            const secret = this.configService.get<string>('jwt.accessSecret') || 'default-secret';
            const payload = this.jwtService.verify(token, { secret });
            const userId = payload.sub;

            if (!userId) {
                throw new UnauthorizedException('Invalid token payload');
            }

            // Store user-socket mapping
            client.data.userId = userId;
            this.socketUserMap.set(client.id, userId);

            if (!this.connectedUsers.has(userId)) {
                this.connectedUsers.set(userId, new Set());
            }
            this.connectedUsers.get(userId)!.add(client.id);

            this.logger.log(`✅ Socket connected: ${client.id} (user: ${userId})`);
            client.emit('connected', { userId });
        } catch (error) {
            this.logger.warn(`Socket ${client.id}: Auth failed — ${error.message}`);
            client.emit('error', { message: 'Authentication failed' });
            client.disconnect();
        }
    }

    /**
     * Clean up on disconnect
     */
    handleDisconnect(client: Socket) {
        const userId = this.socketUserMap.get(client.id);
        if (userId) {
            const userSockets = this.connectedUsers.get(userId);
            if (userSockets) {
                userSockets.delete(client.id);
                if (userSockets.size === 0) {
                    this.connectedUsers.delete(userId);
                }
            }
            this.socketUserMap.delete(client.id);
        }
        this.logger.log(`Socket disconnected: ${client.id}`);
    }

    /**
     * Join a match chat room
     */
    async handleJoinRoom(client: Socket, data: { matchId: string }) {
        const userId = client.data.userId;
        if (!userId) {
            client.emit('error', { message: 'Not authenticated' });
            return;
        }

        try {
            // Validate match access
            await this.messageService.validateMatchAccess(userId, data.matchId);

            const room = `match:${data.matchId}`;
            client.join(room);
            this.logger.log(`User ${userId} joined room ${room}`);

            // Mark messages as delivered when user joins the room
            await this.messageService.markMessagesDelivered(userId, data.matchId);

            // Notify room that user joined (for online status)
            client.to(room).emit('userJoined', { userId, matchId: data.matchId });

            return { event: 'joinedRoom', data: { matchId: data.matchId } };
        } catch (error) {
            this.logger.error(`Join room failed: ${error.message}`);
            client.emit('error', { message: error.message });
        }
    }

    /**
     * Leave a match chat room
     */
    async handleLeaveRoom(client: Socket, data: { matchId: string }) {
        const room = `match:${data.matchId}`;
        client.leave(room);
        this.logger.log(`User ${client.data.userId} left room ${room}`);

        // Notify room that user left
        client.to(room).emit('userLeft', {
            userId: client.data.userId,
            matchId: data.matchId,
        });

        return { event: 'leftRoom', data: { matchId: data.matchId } };
    }

    /**
     * Send a message — persist to DB and broadcast to room
     */
    async handleSendMessage(client: Socket, data: { matchId: string; content: string; tempId?: string }) {
        const userId = client.data.userId;
        if (!userId) {
            client.emit('error', { message: 'Not authenticated' });
            return;
        }

        try {
            // Persist message via service
            const message = await this.messageService.sendMessage(userId, {
                matchId: data.matchId,
                content: data.content,
            });

            const room = `match:${data.matchId}`;

            // Broadcast to all users in the room (including sender for confirmation)
            this.server.to(room).emit('newMessage', {
                ...message,
                tempId: data.tempId, // So sender can replace optimistic message
            });

            // Confirm to sender
            client.emit('messageSent', {
                tempId: data.tempId,
                message,
            });

            return { event: 'messageSent', data: message };
        } catch (error) {
            this.logger.error(`Send message failed: ${error.message}`);
            client.emit('messageError', {
                tempId: data.tempId,
                error: error.message,
            });
        }
    }

    /**
     * Typing indicator
     */
    async handleTyping(client: Socket, data: { matchId: string; isTyping: boolean }) {
        const userId = client.data.userId;
        if (!userId) return;

        const room = `match:${data.matchId}`;

        // Broadcast to room (excluding sender)
        client.to(room).emit('typing', {
            userId,
            matchId: data.matchId,
            isTyping: data.isTyping,
        });
    }

    /**
     * Mark messages as read — update DB and notify sender
     */
    async handleMarkRead(client: Socket, data: { matchId: string }) {
        const userId = client.data.userId;
        if (!userId) return;

        try {
            const result = await this.messageService.markMessagesAsRead(userId, data.matchId);

            const room = `match:${data.matchId}`;

            // Notify the other user that messages were read
            client.to(room).emit('messagesRead', {
                matchId: data.matchId,
                readBy: userId,
                markedCount: result.markedCount,
                readAt: new Date().toISOString(),
            });

            return { event: 'markedRead', data: result };
        } catch (error) {
            this.logger.error(`Mark read failed: ${error.message}`);
            client.emit('error', { message: error.message });
        }
    }

    /**
     * Check if a user is currently online
     */
    isUserOnline(userId: string): boolean {
        return this.connectedUsers.has(userId) &&
            (this.connectedUsers.get(userId)?.size ?? 0) > 0;
    }
}
