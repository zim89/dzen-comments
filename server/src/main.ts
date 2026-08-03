import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const clientOrigins = process.env.CLIENT_URL?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (clientOrigins?.length) {
    app.enableCors({ origin: clientOrigins, credentials: true });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const port = process.env.PORT ?? 4040;
  await app.listen(port);
}
void bootstrap();
