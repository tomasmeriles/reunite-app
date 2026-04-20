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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
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
import { Public } from '../../../auth/decorators/public.decorator';
import { randomUUID } from 'crypto';

@Controller('events')
export class EventsController {
  constructor(
    private readonly events: EventsService,
    private readonly storage: StorageService,
    private readonly imageProcessing: ImageProcessingService,
  ) {}

  @Post()
  createEvent(@Body() dto: CreateEventDto, @CurrentUser() user: SafeUser) {
    return this.events.createEvent(dto, user);
  }

  @Get('mine')
  getMyEvents(@CurrentUser() user: SafeUser) {
    return this.events.findMine(user.id);
  }

  @Public()
  @Get(':id')
  getEvent(@Param('id') id: string) {
    return this.events.findPublic(id);
  }

  @Patch(':id')
  updateEvent(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.events.updateEvent(id, dto, user.id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEventStatusDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.events.updateStatus(id, dto, user.id);
  }

  @Patch(':id/config')
  updateConfig(
    @Param('id') id: string,
    @Body() dto: UpdateEventConfigDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.events.updateConfig(id, dto, user.id);
  }

  @Post(':id/cover')
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
  async deleteEvent(@Param('id') id: string, @CurrentUser() user: SafeUser) {
    return this.events.deleteEvent(id, user.id);
  }
}
