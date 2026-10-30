import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createHmac } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import type { ExecutionContext } from '@nestjs/common';
import { RateGuard } from '../src/marketplace/auth.js';
import type { PrismaService } from '../src/prisma/prisma.service.js';

const db = new PrismaClient();
const base = process.env.E2E_API_URL || 'http://127.0.0.1:4100';
afterAll(() => db.$disconnect());

it('sets security headers, exact CORS, no-store, request IDs and body size limits', async () => {
  const response = await fetch(`${base}/health`, {
    headers: {
      Origin: 'https://attacker.example',
      'X-Forwarded-For': '10.0.0.1',
    },
  });
  expect(response.status).toBe(200);
  expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  expect(response.headers.get('x-frame-options')).toBe('SAMEORIGIN');
  expect(response.headers.get('access-control-allow-origin')).not.toBe(
    'https://attacker.example',
  );
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
  const oversized = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'x'.repeat(70000) }),
  });
  expect(oversized.status).toBe(413);
});

it('atomically limits concurrent requests across API replicas and normalizes route casing', async () => {
  const secret = process.env.JWT_SECRET!;
  const config = new ConfigService({ JWT_SECRET: secret });
  const replicas = [
    new RateGuard(db as PrismaService, config),
    new RateGuard(db as PrismaService, config),
  ];
  const ip = `isolated-test-${Date.now()}`;
  const keyFor = (until: number) =>
    createHmac('sha256', secret)
      .update(`${ip}:/newsletter:${until}`)
      .digest('hex');
  const started = Date.now();
  // Avoid a legitimate rate-window boundary splitting this concurrency assertion.
  if (started % 60000 > 55000)
    await new Promise((resolve) =>
      setTimeout(resolve, 60000 - (started % 60000) + 20),
    );
  const until = Math.floor(Date.now() / 60000) * 60000 + 60000;
  const retryAfter: unknown[] = [];
  try {
    const results = await Promise.allSettled(
      Array.from({ length: 25 }, (_, i) => {
        const context = {
          switchToHttp: () => ({
            getRequest: () => ({
              method: 'POST',
              path: i % 2 ? '/NEWSLETTER/' : '/newsletter',
              ip,
            }),
            getResponse: () => ({
              setHeader: (_: string, value: unknown) => retryAfter.push(value),
            }),
          }),
        } as unknown as ExecutionContext;
        return replicas[i % 2].canActivate(context);
      }),
    );
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(20);
    const rejected = results.filter((result) => result.status === 'rejected');
    expect(rejected).toHaveLength(5);
    for (const result of rejected)
      if (result.status === 'rejected')
        expect(result.reason.getStatus()).toBe(429);
    expect(retryAfter).toHaveLength(5);
    expect(
      retryAfter.every((value) => Number(value) > 0 && Number(value) <= 60),
    ).toBe(true);
    expect(
      (
        await db.rateLimitBucket.findUniqueOrThrow({
          where: { key: keyFor(until) },
        })
      ).count,
    ).toBe(21);
  } finally {
    await db.rateLimitBucket.deleteMany({ where: { key: keyFor(until) } });
  }
});
