import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { INestApplication } from '@nestjs/common';

/**
 * CustomIoAdapter explicitly attaches the Socket.IO server to NestJS's
 * underlying HTTP server. This is critical for Railway deployments where the
 * reverse proxy routes both HTTP API and WebSocket traffic to the same port.
 *
 * Without this, the NestJS Express router intercepts /socket.io/ requests
 * before they can reach the Socket.IO server, causing 404 errors.
 */
export class CustomIoAdapter extends IoAdapter {
    private readonly app: INestApplication;

    constructor(app: INestApplication) {
        super(app);
        this.app = app;
    }

    createIOServer(port: number, options?: ServerOptions): any {
        const server = super.createIOServer(port, {
            ...options,
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
                credentials: true,
            },
            // Allow both transports. Railway's HTTP/2 proxy supports both.
            transports: ['polling', 'websocket'],
            // Polling timeout in ms. Keep low for snappy reconnects.
            pingTimeout: 60000,
            pingInterval: 25000,
        });
        return server;
    }
}
