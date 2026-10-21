
import 'dotenv/config';
import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
  );

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  app.useStaticAssets(
    join(process.cwd(), 'apps', 'api', 'uploads'),
    {
      prefix: '/uploads/',
    },
  );

  const uploadDir = join(
    process.cwd(),
    'apps',
    'api',
    'uploads',
    'avatars',
  );

  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(3000);
}

bootstrap();
