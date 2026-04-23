import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { SafeUser } from '../../users/selects/user.select';
import { EventsService } from '../services/events.service';
import { StorageService } from '../../../storage/services/storage.service';
import { ImageProcessingService } from '../../../storage/services/image-processing.service';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { UpdateEventConfigDto } from '../dto/update-event-config.dto';
import { UpdateEventStatusDto } from '../dto/update-event-status.dto';
import { Throttle } from '@nestjs/throttler';
import { AuditAction, AuditResource } from '@prisma/client';
import { Public } from '../../../auth/decorators/public.decorator';
import { THROTTLE } from '../../../common/constants/throttle.constants';
import { Audit } from '../../audit/decorators/audit.decorator';
import { CheckPolicies } from '../../../casl/decorators/check-policies.decorator';
import { subject } from '../../../casl/factories/casl-ability.factory';
import {
  type EventDetailPayload,
  type EventListPayload,
  type EventPublicPayload,
  type EventWithMembersPayload,
} from '../selects/event.select';
import { randomUUID } from 'crypto';

@Controller('events')
export class EventsController {
  constructor(
    private readonly events: EventsService,
    private readonly storage: StorageService,
    private readonly imageProcessing: ImageProcessingService,
  ) {}

  @Post()
  @Throttle({ default: THROTTLE.WRITE })
  @Audit(AuditAction.EVENT_CREATED, AuditResource.EVENT)
  @CheckPolicies((ability) => ability.can('create', 'Event'))
  create(
    @Body() dto: CreateEventDto,
    @CurrentUser() user: SafeUser,
  ): Promise<EventWithMembersPayload> {
    return this.events.create(dto, user);
  }

  @Get('mine')
  getMine(@CurrentUser() user: SafeUser): Promise<EventListPayload[]> {
    return this.events.findMine(user.id);
  }

  @Public()
  @Get(':id')
  getOne(@Param('id') id: string): Promise<EventPublicPayload> {
    return this.events.findPublic(id);
  }

  @Patch(':id')
  @Throttle({ default: THROTTLE.WRITE })
  @Audit(AuditAction.EVENT_UPDATED, AuditResource.EVENT)
  @CheckPolicies((ability, req: Request) =>
    ability.can('update', subject('Event', { id: req.params['id'] })),
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: SafeUser,
  ): Promise<EventDetailPayload> {
    return this.events.update(id, dto, user.id);
  }

  @Patch(':id/status')
  @Throttle({ default: THROTTLE.WRITE })
  @Audit(AuditAction.EVENT_UPDATED, AuditResource.EVENT)
  @CheckPolicies((ability, req: Request) =>
    ability.can('update', subject('Event', { id: req.params['id'] })),
  )
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEventStatusDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.events.updateStatus(id, dto, user.id);
  }

  @Patch(':id/config')
  @Throttle({ default: THROTTLE.WRITE })
  @Audit(AuditAction.EVENT_UPDATED, AuditResource.EVENT)
  @CheckPolicies((ability, req: Request) =>
    ability.can('manage', subject('EventConfig', { eventId: req.params['id'] })),
  )
  updateConfig(
    @Param('id') id: string,
    @Body() dto: UpdateEventConfigDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.events.updateConfig(id, dto, user.id);
  }

  @Post(':id/cover')
  @Throttle({ default: THROTTLE.UPLOAD })
  @Audit(AuditAction.EVENT_UPDATED, AuditResource.EVENT)
  @CheckPolicies((ability, req: Request) =>
    ability.can('update', subject('Event', { id: req.params['id'] })),
  )
  @UseInterceptors(FileInterceptor('file'))
  async uploadCover(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: SafeUser,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    const processed = await this.imageProcessing.toWebP(file.buffer, {
      width: 1920,
      quality: 85,
    });
    const key = `events/${id}/cover/${randomUUID()}`;
    await this.storage.upload(key, processed, { contentType: 'image/webp' });
    return this.events.setCoverImage(id, key, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: THROTTLE.WRITE })
  @Audit(AuditAction.DELETE, AuditResource.EVENT)
  @CheckPolicies((ability, req: Request) =>
    ability.can('delete', subject('Event', { id: req.params['id'] })),
  )
  remove(
    @Param('id') id: string,
    @CurrentUser() user: SafeUser,
  ): Promise<void> {
    return this.events.delete(id, user.id);
  }
}
