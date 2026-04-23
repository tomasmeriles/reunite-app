import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { EventsController } from './controllers/events.controller';
import { EventsService } from './services/events.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../../storage/storage.module';
import { GeoModule } from '../geo/geo.module';
import { CaslModule } from '../../casl/casl.module';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    GeoModule,
    CaslModule,
    MulterModule.register({ limits: { fileSize: 10 * 1024 * 1024 } }), // 10 MB
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
