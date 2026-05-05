import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { SafeUser } from '../../users/selects/user.select';
import { WhitelistService } from '../services/whitelist.service';
import { AddToWhitelistDto } from '../dto/add-to-whitelist.dto';

@Controller('events/:eventId/whitelist')
export class WhitelistController {
  constructor(private readonly whitelist: WhitelistService) {}

  @Post()
  add(
    @Param('eventId') eventId: string,
    @Body() dto: AddToWhitelistDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.whitelist.add(eventId, dto, user.id);
  }

  @Get()
  findByEvent(
    @Param('eventId') eventId: string,
    @CurrentUser() user: SafeUser,
  ) {
    return this.whitelist.findByEvent(eventId, user.id);
  }

  @Delete(':entryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('eventId') eventId: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: SafeUser,
  ) {
    return this.whitelist.remove(eventId, entryId, user.id);
  }
}
