import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/services/config.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RtcAuthMiddleware } from './middleware/rtc-auth.middleware';

/**
 * RtcModule — shared infrastructure for all real-time WebSocket gateways.
 *
 * Provides:
 *   - RtcAuthMiddleware: identifies connections as user or guest
 *   - BaseGateway: reusable gateway base class (not a provider, just imported)
 *
 * Usage in a feature module:
 *   imports: [RtcModule]
 *   Then apply middleware.middleware() in your gateway's afterInit().
 */
@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
      }),
    }),
  ],
  providers: [RtcAuthMiddleware],
  exports: [RtcAuthMiddleware],
})
export class RtcModule {}
