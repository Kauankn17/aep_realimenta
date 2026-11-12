// Carrega o arquivo .env ANTES de qualquer outro import, para que as
// credenciais do banco ja estejam disponiveis quando o AppModule for avaliado.
import 'dotenv/config';
import 'reflect-metadata';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Toda a API REST fica sob /api; a interface grafica e servida na raiz.
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Interface grafica (HTML/CSS/JS) servida pelo proprio backend.
  app.useStaticAssets(join(__dirname, '..', 'public'));

  const porta = Number(process.env.PORT ?? 3000);
  await app.listen(porta);

  // eslint-disable-next-line no-console
  console.log(`ReAlimenta em execucao: http://localhost:${porta}`);
}

void bootstrap();
