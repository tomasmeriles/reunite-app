import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Headers,
} from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { Public } from '../../../auth/decorators/public.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { SafeUser } from '../../users/selects/user.select';
import { AttendanceService } from '../services/attendance.service';
import { RegisterAttendeeDto } from '../dto/register-attendee.dto';

// TODO: Move this to the dto folder
class BringGuestDto {
  @IsString()
  @MinLength(1)
  guestName!: string;
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
  ) {
    return this.attendance.unregister(eventId, user, guestToken);
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

  @Public()
  @Get()
  getAttendees(@Param('eventId') eventId: string) {
    return this.attendance.findAttendees(eventId);
  }
}
