import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io'; // 🔥 IMPORTANT
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    rawBody: true, // required for Razorpay webhook
  });

  const configService = app.get(ConfigService);

  // ✅ Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ✅ CORS (important for mobile + sockets)
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // 🔥🔥🔥 CRITICAL FIX — ENABLE SOCKET.IO
  app.useWebSocketAdapter(new IoAdapter(app));

  // ✅ Graceful shutdown
  app.enableShutdownHooks();

  const port = configService.get<number>('port', 3000);

  await app.listen(port, '0.0.0.0');

  console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║                                                       ║
  ║   🚀 WhatsLeft Backend Server Running                 ║
  ║                                                       ║
  ║   📡 Port: ${port}                                    ║
  ║   🌍 Environment: ${configService.get('nodeEnv')}      ║
  ║   📱 Mobile App Ready                                 ║
  ║   🔐 OTP Authentication Active                        ║
  ║   🔌 WebSocket Chat Active                            ║
  ║   🔗 Network: http://0.0.0.0:${port}                  ║
  ║                                                       ║
  ╚═══════════════════════════════════════════════════════╝
  `);
}

bootstrap();