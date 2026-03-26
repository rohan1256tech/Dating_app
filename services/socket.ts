import { io, Socket } from 'socket.io-client';

// Keep this in sync with api.ts API_BASE_URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://backend-production-1ad4.up.railway.app';

class SocketService {
    private socket: Socket | null = null;
    private messageListeners: Set<(message: any) => void> = new Set();
    private typingListeners: Set<(data: { matchId: string; userId: string; isTyping: boolean }) => void> = new Set();
    private readReceiptListeners: Set<(data: { matchId: string; readBy: string; markedCount: number; readAt: string }) => void> = new Set();
    
    // Offline queue for optimistic updates when disconnected
    private offlineQueue: Array<{ event: string; data: any }> = [];

    /**
     * Initialize connection with JWT token
     */
    connect(token: string) {
        if (this.socket?.connected) return;

        console.log('🔌 [SocketService] Connecting to:', API_BASE_URL);
        
        this.socket = io(`${API_BASE_URL}/chat`, {
            auth: { token },
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
        });

        this.setupListeners();
    }

    /**
     * Clean disconnect
     */
    disconnect() {
        if (this.socket) {
            console.log('🔌 [SocketService] Disconnecting');
            this.socket.disconnect();
            this.socket = null;
        }
    }

    /**
     * Configure base socket listeners
     */
    private setupListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('✅ [SocketService] Connected:', this.socket?.id);
            this.flushOfflineQueue();
        });

        this.socket.on('disconnect', (reason: string) => {
            console.log('⚠️ [SocketService] Disconnected:', reason);
        });

        this.socket.on('error', (error: any) => {
            console.error('❌ [SocketService] Error:', error);
        });

        // Chat Events
        this.socket.on('newMessage', (message: any) => {
            this.messageListeners.forEach(listener => listener(message));
        });

        this.socket.on('typing', (data: { matchId: string; userId: string; isTyping: boolean }) => {
            this.typingListeners.forEach(listener => listener(data));
        });

        this.socket.on('messagesRead', (data: { matchId: string; readBy: string; markedCount: number; readAt: string }) => {
            this.readReceiptListeners.forEach(listener => listener(data));
        });
    }

    /**
     * Flush messages queued while offline
     */
    private flushOfflineQueue() {
        if (!this.socket?.connected || this.offlineQueue.length === 0) return;
        
        console.log(`🔌 [SocketService] Flushing ${this.offlineQueue.length} queued events`);
        const queue = [...this.offlineQueue];
        this.offlineQueue = [];
        
        queue.forEach(({ event, data }) => {
            this.socket?.emit(event, data);
        });
    }

    /**
     * Join a specific match room
     */
    joinRoom(matchId: string) {
        if (!this.socket?.connected) {
            this.offlineQueue.push({ event: 'joinRoom', data: { matchId } });
            return;
        }
        console.log(`🔌 [SocketService] Joining room: ${matchId}`);
        this.socket.emit('joinRoom', { matchId });
    }

    /**
     * Leave a specific match room
     */
    leaveRoom(matchId: string) {
        if (!this.socket?.connected) return;
        console.log(`🔌 [SocketService] Leaving room: ${matchId}`);
        this.socket.emit('leaveRoom', { matchId });
    }

    /**
     * Send a message
     */
    sendMessage(matchId: string, content: string, tempId: string) {
        const data = { matchId, content, tempId };
        
        if (!this.socket?.connected) {
            console.log('🔌 [SocketService] Queuing message (offline)');
            this.offlineQueue.push({ event: 'sendMessage', data });
            return;
        }
        
        this.socket.emit('sendMessage', data);
    }

    /**
     * Emit typing status
     */
    emitTyping(matchId: string, isTyping: boolean) {
        if (!this.socket?.connected) return;
        this.socket.emit('typing', { matchId, isTyping });
    }

    /**
     * Mark messages as read in a room
     */
    markRead(matchId: string) {
        if (!this.socket?.connected) {
            this.offlineQueue.push({ event: 'markRead', data: { matchId } });
            return;
        }
        this.socket.emit('markRead', { matchId });
    }

    // --- Subscriptions ---

    onNewMessage(callback: (message: any) => void) {
        this.messageListeners.add(callback);
        return () => this.messageListeners.delete(callback);
    }

    onTyping(callback: (data: { matchId: string; userId: string; isTyping: boolean }) => void) {
        this.typingListeners.add(callback);
        return () => this.typingListeners.delete(callback);
    }

    onMessageRead(callback: (data: { matchId: string; readBy: string; markedCount: number; readAt: string }) => void) {
        this.readReceiptListeners.add(callback);
        return () => this.readReceiptListeners.delete(callback);
    }
}

export const socketService = new SocketService();
export default socketService;
