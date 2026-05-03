import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  Body,
  Headers,
} from '@nestjs/common';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '../../../auth/decorators/public.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { SafeUser } from '../../users/selects/user.select';
import { MediaService } from '../services/media.service';
import { ErrorCode } from '../../../common/errors/error-codes.enum';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

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
    if (!file) throw new BadRequestException({ code: ErrorCode.NO_FILE_PROVIDED });
    if (file.size > MAX_FILE_SIZE) throw new BadRequestException({ code: ErrorCode.FILE_TOO_LARGE });
    const requester = user ? { userId: user.id } : { guestToken };
    return this.media.upload(eventId, requester, file, caption);
  }

  @Public()
  @Get()
  findAll(
    @Param('eventId') eventId: string,
    @CurrentUser() user: SafeUser | undefined,
    @Headers('x-guest-token') guestToken: string | undefined,
    @Query() query: PaginationQueryDto,
  ) {
    return this.media.findByEvent(eventId, { userId: user?.id, guestToken }, query);
  }

  @Public()
  @Delete(':itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('eventId') eventId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: SafeUser | undefined,
    @Headers('x-guest-token') guestToken: string | undefined,
  ) {
    if (!user && !guestToken) throw new ForbiddenException({ code: ErrorCode.FORBIDDEN });
    return this.media.delete(eventId, itemId, { userId: user?.id, guestToken });
  }
}
