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
import { Public } from '../../../auth/decorators/public.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { SafeUser } from '../../users/selects/user.select';
import { InviteLinksService } from '../services/invite-links.service';
import { CreateInviteLinkDto } from '../dto/create-invite-link.dto';

@Controller()
export class InviteLinksController {
  constructor(private readonly inviteLinks: InviteLinksService) {}

  @Post('events/:eventId/invite-links')
  create(
    @Param('eventId') eventId: string,
    @Body() dto: CreateInviteLinkDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.inviteLinks.create(eventId, dto, user.id);
  }

  @Get('events/:eventId/invite-links')
  findByEvent(
    @Param('eventId') eventId: string,
    @CurrentUser() user: SafeUser,
  ) {
    return this.inviteLinks.findByEvent(eventId, user.id);
  }

  @Public()
  @Get('invite-links/:token')
  resolveToken(@Param('token') token: string) {
    return this.inviteLinks.resolveToken(token);
  }

  @Delete('events/:eventId/invite-links/:linkId')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('eventId') eventId: string,
    @Param('linkId') linkId: string,
    @CurrentUser() user: SafeUser,
  ) {
    return this.inviteLinks.delete(eventId, linkId, user.id);
  }
}
