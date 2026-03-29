const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { CustomIoAdapter } = require('./dist/adapters/socket-io.adapter');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new CustomIoAdapter(app));
  await app.init();
  await app.listen(3002);
  console.log('✅ App successfully started. Exiting in 3s...');
  setTimeout(() => process.exit(0), 3000);
}
bootstrap();
