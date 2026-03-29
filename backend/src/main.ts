import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    rawBody: true,
  });

  const configService = app.get(ConfigService);

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

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useWebSocketAdapter(new IoAdapter(app));
  app.enableShutdownHooks();

  const port = parseInt(process.env.PORT || '8080', 10);

  await app.listen(port, '0.0.0.0');

  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 Detto Backend Server Running                     ║
║                                                       ║
║   📡 Port: ${port}                                    ║
║   🌍 Environment: ${configService.get('nodeEnv')}     ║
║   📱 Mobile App Ready                                 ║
║   🔐 OTP Authentication Active                        ║
║   🔌 WebSocket Chat Active                            ║
║   🔗 Network: http://0.0.0.0:${port}                  ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
}

bootstrap();