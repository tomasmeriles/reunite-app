import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { BaseQueueService } from '../../../queue/base/base-queue.service';

export const EVENT_TRANSITIONS_QUEUE = 'event-transitions';

export type EventTransitionJobName = 'auto-active' | 'auto-ended';

export interface EventTransitionJobData {
  eventId: string;
}

@Injectable()
export class EventTransitionsQueueService extends BaseQueueService<
  EventTransitionJobName,
  EventTransitionJobData
> {
  constructor(
    @InjectQueue(EVENT_TRANSITIONS_QUEUE)
    queue: Queue<EventTransitionJobData, void, EventTransitionJobName>,
  ) {
    super(queue);
  }

  async scheduleAutoActive(eventId: string, startAt: Date): Promise<void> {
    const delay = Math.max(0, startAt.getTime() - Date.now());
    await this.queue.remove(`auto-active_${eventId}`);
    await this.add(
      'auto-active',
      { eventId },
      { delay, jobId: `auto-active_${eventId}` },
    );
  }

  async scheduleAutoEnded(eventId: string, endAt: Date): Promise<void> {
    const delay = Math.max(0, endAt.getTime() - Date.now());
    await this.queue.remove(`auto-ended_${eventId}`);
    await this.add(
      'auto-ended',
      { eventId },
      { delay, jobId: `auto-ended_${eventId}` },
    );
  }

  async cancelAutoActive(eventId: string): Promise<void> {
    await this.queue.remove(`auto-active_${eventId}`);
  }

  async cancelAutoEnded(eventId: string): Promise<void> {
    await this.queue.remove(`auto-ended_${eventId}`);
  }
}
