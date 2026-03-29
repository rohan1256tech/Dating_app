import {
    Injectable,
    Logger,
    OnModuleInit,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageService } from './message.service';

@Injectable()
@WebSocketGateway({
    path: '/socket.io',
    cors: {
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST'],
    },
    transports: ['polling', 'websocket'],
    pingTimeout: 60000,
    pingInterval: 25000,
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);
    private connectedUsers = new Map<string, Set<string>>();
    private socketUserMap = new Map<string, string>();

    constructor(
        private readonly messageService: MessageService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {
        console.log('🔥 ChatGateway initialized');
    }

    onModuleInit() {
        this.logger.log('🚀 WebSocket Gateway Module Initialized successfully!');
    }

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

    @SubscribeMessage('joinRoom')
    async handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { matchId: string },
    ) {
        const userId = client.data.userId;
        if (!userId) {
            client.emit('error', { message: 'Not authenticated' });
            return;
        }
        try {
            await this.messageService.validateMatchAccess(userId, data.matchId);
            const room = `match:${data.matchId}`;
            client.join(room);
            this.logger.log(`User ${userId} joined room ${room}`);
            await this.messageService.markMessagesDelivered(userId, data.matchId);
            client.to(room).emit('userJoined', { userId, matchId: data.matchId });
            return { event: 'joinedRoom', data: { matchId: data.matchId } };
        } catch (error) {
            this.logger.error(`Join room failed: ${error.message}`);
            client.emit('error', { message: error.message });
        }
    }

    @SubscribeMessage('leaveRoom')
    async handleLeaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { matchId: string },
    ) {
        const room = `match:${data.matchId}`;
        client.leave(room);
        this.logger.log(`User ${client.data.userId} left room ${room}`);
        client.to(room).emit('userLeft', { userId: client.data.userId, matchId: data.matchId });
        return { event: 'leftRoom', data: { matchId: data.matchId } };
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { matchId: string; content: string; tempId?: string },
    ) {
        const userId = client.data.userId;
        if (!userId) {
            client.emit('error', { message: 'Not authenticated' });
            return;
        }
        try {
            const message = await this.messageService.sendMessage(userId, {
                matchId: data.matchId,
                content: data.content,
            });
            const room = `match:${data.matchId}`;
            this.server.to(room).emit('newMessage', { ...message, tempId: data.tempId });
            client.emit('messageSent', { tempId: data.tempId, message });
            return { event: 'messageSent', data: message };
        } catch (error) {
            this.logger.error(`Send message failed: ${error.message}`);
            client.emit('messageError', { tempId: data.tempId, error: error.message });
        }
    }

    @SubscribeMessage('typing')
    async handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { matchId: string; isTyping: boolean },
    ) {
        const userId = client.data.userId;
        if (!userId) return;
        const room = `match:${data.matchId}`;
        client.to(room).emit('typing', { userId, matchId: data.matchId, isTyping: data.isTyping });
    }

    @SubscribeMessage('markRead')
    async handleMarkRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { matchId: string },
    ) {
        const userId = client.data.userId;
        if (!userId) return;
        try {
            const result = await this.messageService.markMessagesAsRead(userId, data.matchId);
            const room = `match:${data.matchId}`;
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

    isUserOnline(userId: string): boolean {
        return (
            this.connectedUsers.has(userId) &&
            (this.connectedUsers.get(userId)?.size ?? 0) > 0
        );
    }
}