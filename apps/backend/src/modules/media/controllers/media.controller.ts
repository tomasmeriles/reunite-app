import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Headers,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '../../../auth/decorators/public.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { SafeUser } from '../../users/selects/user.select';
import { MediaService } from '../services/media.service';

@Controller('events/:eventId/media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Public()
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('eventId') eventId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('caption') caption: string | undefined,
    @CurrentUser() user: SafeUser | undefined,
    @Headers('x-guest-token') guestToken: string | undefined,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    const attendeeId = (user as any)?.attendeeId ?? guestToken ?? '';
    return this.media.upload(eventId, attendeeId, file, caption);
  }

  @Public()
  @Get()
  findAll(@Param('eventId') eventId: string) {
    return this.media.findByEvent(eventId);
  }

  @Delete(':itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('eventId') eventId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: SafeUser,
  ) {
    return this.media.delete(eventId, itemId, user.id);
  }
}
