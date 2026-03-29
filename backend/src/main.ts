import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomIoAdapter } from './adapters/socket-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    rawBody: true,   // ← required for Razorpay webhook HMAC signature verification
  });

  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error for unknown properties
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration for mobile app
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ─── WebSocket Adapter ───────────────────────────────────────────────────
  // MUST be set before app.listen() so the Socket.io server attaches to
  // the same HTTP server that NestJS is using. Without this, Railway's HTTP
  // router intercepts the WS upgrade request and returns 404.
  app.useWebSocketAdapter(new CustomIoAdapter(app));
  // ────────────────────────────────────────────────────────────────────────

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = configService.get<number>('port', 3000);
  await app.listen(port, '0.0.0.0'); // Listen on all network interfaces

  console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║                                                       ║
  ║   🚀 WhatsLeft Backend Server Running                ║
  ║                                                       ║
  ║   📡 Port: ${port}                                      ║
  ║   🌍 Environment: ${configService.get('nodeEnv')}              ║
  ║   📱 Mobile App Ready                                 ║
  ║   🔐 OTP Authentication Active                        ║
  ║   🔌 WebSocket Chat Active                            ║
  ║   🔗 Network: http://0.0.0.0:${port}                   ║
  ║                                                       ║
  ╚═══════════════════════════════════════════════════════╝
  `);
}

bootstrap();
