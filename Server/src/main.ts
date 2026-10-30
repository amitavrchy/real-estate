import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { DatabaseFilter } from './marketplace/database.filter.js';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const express = app.getHttpAdapter().getInstance();
  express.disable('x-powered-by');
  if (process.env.TRUST_PROXY)
    express.set(
      'trust proxy',
      process.env.TRUST_PROXY.split(',').map((value) => value.trim()),
    );
  app.use(
    helmet({
      strictTransportSecurity:
        process.env.NODE_ENV === 'production' ? { maxAge: 31536000 } : false,
    }),
  );
  app.use(json({ limit: '64kb' }));
  app.use(urlencoded({ extended: false, limit: '64kb' }));
  app.use((req: Request, res: Response, next: NextFunction) => {
    const started = Date.now();
    const requestId = randomUUID();
    res.setHeader('X-Request-Id', requestId);
    // Authenticated responses and leads must never enter a shared cache.
    res.setHeader('Cache-Control', 'no-store');
    res.on('finish', () =>
      console.info(
        JSON.stringify({
          requestId,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs: Date.now() - started,
        }),
      ),
    );
    next();
  });
  app.enableCors({
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3001',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new DatabaseFilter());
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 4100, process.env.HOST ?? '0.0.0.0');
}
await bootstrap();
