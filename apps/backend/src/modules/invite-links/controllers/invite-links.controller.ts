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
import { InviteLinksService } from '../services/invite-links.service';
import { CreateInviteLinkDto } from '../dto/create-invite-link.dto';
import { CheckPolicies } from '../../../casl/decorators/check-policies.decorator';
import { subject } from '@casl/ability';
import type { Request } from 'express';

@Controller()
export class InviteLinksController {
  constructor(private readonly inviteLinks: InviteLinksService) {}

  @Post('events/:eventId/invite-links')
  @CheckPolicies((ability, req: Request) =>
    ability.can(
      'update',
      subject('InviteLink', { eventId: req.params['eventId'] }),
    ),
  )
  create(@Param('eventId') eventId: string, @Body() dto: CreateInviteLinkDto) {
    return this.inviteLinks.create(eventId, dto);
  }

  @Get('events/:eventId/invite-links')
  @CheckPolicies((ability, req: Request) =>
    ability.can(
      'read',
      subject('InviteLink', { eventId: req.params['eventId'] }),
    ),
  )
  findByEvent(@Param('eventId') eventId: string) {
    return this.inviteLinks.findByEvent(eventId);
  }

  @Public()
  @Get('invite-links/:token')
  resolveToken(@Param('token') token: string) {
    return this.inviteLinks.resolveToken(token);
  }

  @Delete('events/:eventId/invite-links/:linkId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @CheckPolicies((ability, req: Request) =>
    ability.can(
      'delete',
      subject('InviteLink', { eventId: req.params['eventId'] }),
    ),
  )
  delete(@Param('eventId') eventId: string, @Param('linkId') linkId: string) {
    return this.inviteLinks.delete(eventId, linkId);
  }
}
