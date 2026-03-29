import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';
import { INestApplication } from '@nestjs/common';

/**
 * CustomIoAdapter — attaches the Socket.IO server DIRECTLY to the NestJS
 * HTTP server instance.
 *
 * The key issue on Railway: NestJS's default IoAdapter calls
 * `super.createIOServer(port, options)` with the gateway PORT (default 0),
 * which creates a SEPARATE Socket.IO HTTP server, not attached to the main
 * Express server that Railway routes traffic to.
 *
 * This adapter overrides the behaviour so that Socket.IO is attached to the
 * SAME underlying http.Server that NestJS Express is listening on (port 0 =
 * use the existing server, not a new one).
 */
export class CustomIoAdapter extends IoAdapter {
    createIOServer(port: number, options?: ServerOptions): Server {
        // Pass port = 0 to make Socket.IO attach to the existing HTTP server
        // instead of spawning a new one on a random port.
        const server = super.createIOServer(0, {
            ...options,
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
                credentials: true,
            },
            transports: ['polling', 'websocket'],
            pingTimeout: 60000,
            pingInterval: 25000,
        });
        return server;
    }
}
