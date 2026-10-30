import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  JwtAuthGuard,
  JwtStrategy,
  OptionalJwtGuard,
  RateGuard,
  RolesGuard,
} from './auth.js';
import { MarketplaceController } from './marketplace.controller.js';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow('JWT_SECRET'),
        signOptions: {
          expiresIn: '8h',
          algorithm: 'HS256',
          issuer: 'haven-api',
          audience: 'haven-web',
        },
      }),
    }),
  ],
  controllers: [MarketplaceController],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    OptionalJwtGuard,
    RolesGuard,
    { provide: APP_GUARD, useClass: RateGuard },
  ],
})
export class MarketplaceModule {}
