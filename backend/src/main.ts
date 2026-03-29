import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { AppModule } from './app.module';
import { ChatGateway } from './message/chat.gateway';

async function bootstrap() {
  const expressApp = express();

  // DEBUG LOGGER: See exactly what Railway is passing to Node
  expressApp.use((req, res, next) => {
    if (req.url.includes('socket')) {
      console.log(`[HTTP TRACE] method=${req.method} url=${req.url}`);
    }
    next();
  });

  const httpServer = createServer(expressApp);

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['polling', 'websocket'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    rawBody: true,
  });

  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.enableShutdownHooks();

  // Initialize Socket.io in ChatGateway
  const chatGateway = app.get(ChatGateway);
  chatGateway.setServer(io);

  await app.init();
  
  const port = configService.get<number>('port', 3000);
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`
    ╔═══════════════════════════════════════════════════════╗
    ║                                                       ║
    ║   🚀 Dating App Backend Server Running               ║
    ║                                                       ║
    ║   📡 Port: ${port}                                      ║
    ║   🌍 Environment: ${configService.get('nodeEnv')}              ║
    ║   📱 Mobile App Ready                                 ║
    ║   🔐 OTP Authentication Active                        ║
    ║   🔌 Native Socket.IO Active                          ║
    ║   🔗 Network: http://0.0.0.0:${port}                   ║
    ║                                                       ║
    ╚═══════════════════════════════════════════════════════╝
    `);
  });
}

bootstrap();
