import { Logger } from '@nestjs/common';
import { Processor } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { EventStatus } from '@prisma/client';
import { BaseProcessor } from '../../../queue/base/base.processor';
import { PrismaService } from '../../../prisma/services/prisma.service';
import { AbilityCacheService } from '../../../casl/services/ability-cache.service';
import {
  EVENT_TRANSITIONS_QUEUE,
  EventTransitionsQueueService,
  type EventTransitionJobData,
  type EventTransitionJobName,
} from './event-transitions.queue';

@Processor(EVENT_TRANSITIONS_QUEUE)
export class EventTransitionsProcessor extends BaseProcessor<EventTransitionJobData> {
  protected readonly logger = new Logger(EventTransitionsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transitions: EventTransitionsQueueService,
    private readonly abilityCache: AbilityCacheService,
  ) {
    super();
  }

  async process(job: Job<EventTransitionJobData>): Promise<void> {
    const { eventId } = job.data;
    const name = job.name as EventTransitionJobName;

    if (name === 'auto-active') {
      await this.handleAutoActive(eventId);
    } else if (name === 'auto-ended') {
      await this.handleAutoEnded(eventId);
    }
  }

  private async handleAutoActive(eventId: string): Promise<void> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { status: true, endAt: true },
    });

    if (!event || event.status === EventStatus.ACTIVE) return;

    const allowedSources: EventStatus[] = [
      EventStatus.PUBLISHED,
      EventStatus.RESCHEDULED,
    ];
    if (!allowedSources.includes(event.status)) {
      this.logger.warn(
        `auto-active skipped: event ${eventId} is in status ${event.status}`,
      );
      return;
    }

    const now = new Date();
    await this.prisma.event.update({
      where: { id: eventId },
      data: { status: EventStatus.ACTIVE, startedAt: now },
    });

    await this.transitions.scheduleAutoEnded(eventId, event.endAt);

    const staff = await this.prisma.eventStaff.findMany({
      where: { eventId },
      select: { userId: true },
    });
    await this.abilityCache.delMany(staff.map((s) => s.userId));

    this.logger.log(`Event ${eventId} auto-transitioned to ACTIVE`);
  }

  private async handleAutoEnded(eventId: string): Promise<void> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { status: true },
    });

    if (!event || event.status === EventStatus.ENDED) return;

    if (event.status !== EventStatus.ACTIVE) {
      this.logger.warn(
        `auto-ended skipped: event ${eventId} is in status ${event.status}`,
      );
      return;
    }

    const now = new Date();
    await this.prisma.event.update({
      where: { id: eventId },
      data: { status: EventStatus.ENDED, endedAt: now },
    });

    const staff = await this.prisma.eventStaff.findMany({
      where: { eventId },
      select: { userId: true },
    });
    await this.abilityCache.delMany(staff.map((s) => s.userId));

    this.logger.log(`Event ${eventId} auto-transitioned to ENDED`);
  }
}
