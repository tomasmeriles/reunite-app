import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Headers,
} from '@nestjs/common';
import type { Request } from 'express';
import { subject } from '@casl/ability';
import { AttendeeQueryDto } from '../dto/attendee-query.dto';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { Public } from '../../../auth/decorators/public.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { CheckPolicies } from '../../../casl/decorators/check-policies.decorator';
import type { SafeUser } from '../../users/selects/user.select';
import { AttendanceService } from '../services/attendance.service';
import { RegisterAttendeeDto } from '../dto/register-attendee.dto';

// TODO: Move these to the dto folder
class BringGuestDto {
  @IsString()
  @MinLength(1)
  guestName!: string;
}

class UnregisterDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

@Controller('events/:eventId/attendees')
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Public()
  @Post()
  register(
    @Param('eventId') eventId: string,
    @Body() dto: RegisterAttendeeDto,
    @CurrentUser() user?: SafeUser,
  ) {
    return this.attendance.register(eventId, dto, user);
  }

  @Public()
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  unregister(
    @Param('eventId') eventId: string,
    @CurrentUser() user?: SafeUser,
    @Headers('x-guest-token') guestToken?: string,
    @Body() dto?: UnregisterDto,
  ) {
    return this.attendance.unregister(eventId, user, guestToken, dto?.reason);
  }

  @Public()
  @Get('me')
  getMyAttendance(
    @Param('eventId') eventId: string,
    @CurrentUser() user?: SafeUser,
    @Headers('x-guest-token') guestToken?: string,
  ) {
    return this.attendance.findMyAttendance(eventId, user, guestToken);
  }

  @Public()
  @Post('bring-guest')
  bringGuest(
    @Param('eventId') eventId: string,
    @Body() dto: BringGuestDto,
    @CurrentUser() user?: SafeUser,
    @Headers('x-guest-token') guestToken?: string,
  ) {
    return this.attendance.bringGuest(
      eventId,
      dto.guestName,
      user?.id,
      guestToken,
    );
  }

  @Get('all')
  @CheckPolicies((ability, req: Request) =>
    ability.can(
      'manage',
      subject('EventAttendee', { eventId: req.params['eventId'] }),
    ),
  )
  getAllAttendees(
    @Param('eventId') eventId: string,
    @Query() query: AttendeeQueryDto,
  ) {
    return this.attendance.findAllAttendees(eventId, query);
  }

  @Public()
  @Get()
  getAttendees(
    @Param('eventId') eventId: string,
    @Query() query: AttendeeQueryDto,
    @CurrentUser() user?: SafeUser,
    @Headers('x-guest-token') guestToken?: string,
  ) {
    return this.attendance.findAttendees(eventId, query, user, guestToken);
  }

  @Delete(':attendeeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @CheckPolicies((ability, req: Request) =>
    ability.can(
      'delete',
      subject('EventAttendee', { eventId: req.params['eventId'] }),
    ),
  )
  removeAttendee(
    @Param('eventId') eventId: string,
    @Param('attendeeId') attendeeId: string,
    @CurrentUser() user?: SafeUser,
  ) {
    return this.attendance.removeAttendee(eventId, attendeeId, user?.id);
  }
}
