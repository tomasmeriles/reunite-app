import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { BullModule } from '@nestjs/bullmq';
import { EventsController } from './controllers/events.controller';
import { EventsService } from './services/events.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../../storage/storage.module';
import { GeoModule } from '../geo/geo.module';
import { CaslModule } from '../../casl/casl.module';
import {
  EVENT_TRANSITIONS_QUEUE,
  EventTransitionsQueueService,
} from './queue/event-transitions.queue';
import { EventTransitionsProcessor } from './queue/event-transitions.processor';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    GeoModule,
    CaslModule,
    MulterModule.register({ limits: { fileSize: 10 * 1024 * 1024 } }), // 10 MB
    BullModule.registerQueue({ name: EVENT_TRANSITIONS_QUEUE }),
  ],
  controllers: [EventsController],
  providers: [EventsService, EventTransitionsQueueService, EventTransitionsProcessor],
  exports: [EventsService],
})
export class EventsModule {}
