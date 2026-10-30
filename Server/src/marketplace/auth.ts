import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { createHmac } from 'node:crypto';

export type Principal = { id: string; email: string; name: string; role: Role };
export type AuthRequest = Request & { user: Principal };
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
export const publicUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  avatarUrl: true,
  bio: true,
} as const;
export const agentSelect = {
  id: true,
  name: true,
  phone: true,
  avatarUrl: true,
  bio: true,
} as const;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private db: PrismaService,
  ) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret || secret.length < 32 || secret.startsWith('replace-with'))
      throw new Error(
        'Set JWT_SECRET to a random secret of at least 32 characters.',
      );
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      algorithms: ['HS256'],
      issuer: 'haven-api',
      audience: 'haven-web',
    });
  }
  async validate(payload: { sub: string }) {
    const user = await this.db.user.findUnique({
      where: { id: payload.sub },
      select: publicUser,
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = Principal>(err: unknown, user: TUser): TUser {
    if (err) throw err;
    return user || (undefined as TUser);
  }
}
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    return (
      !roles ||
      roles.includes(
        context.switchToHttp().getRequest<AuthRequest>().user?.role,
      )
    );
  }
}
@Injectable()
export class RateGuard implements CanActivate {
  private lastCleanup = 0;
  constructor(
    private db: PrismaService,
    private config: ConfigService,
  ) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<Request>();
    const path = req.path.toLowerCase().replace(/\/+$/, '');
    if (
      req.method !== 'POST' ||
      !/^\/(auth\/(login|register)|inquiries|newsletter|valuation)$/.test(path)
    )
      return true;
    const now = Date.now();
    const until = new Date(Math.floor(now / 60000) * 60000 + 60000);
    const key = createHmac(
      'sha256',
      this.config.getOrThrow<string>('JWT_SECRET'),
    )
      .update(`${req.ip}:${path}:${until.getTime()}`)
      .digest('hex');
    // An atomic increment makes limits hold across concurrent requests and replicas.
    const [bucket] = await this.db.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimitBucket" ("key", "count", "expiresAt")
      VALUES (${key}, 1, ${until})
      ON CONFLICT ("key") DO UPDATE SET "count" = LEAST("RateLimitBucket"."count" + 1, 21)
      RETURNING "count"
    `;
    if (now - this.lastCleanup > 60000) {
      this.lastCleanup = now;
      await this.db.rateLimitBucket.deleteMany({
        where: { expiresAt: { lt: new Date(now) } },
      });
    }
    if (bucket.count > 20) {
      ctx
        .switchToHttp()
        .getResponse<Response>()
        .setHeader('Retry-After', Math.ceil((until.getTime() - now) / 1000));
      throw new HttpException(
        'Too many requests. Please try again in a minute.',
        429,
      );
    }
    return true;
  }
}
