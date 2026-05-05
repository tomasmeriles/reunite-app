import { IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterAttendeeDto {
  /** Required for guest registrations (no account). Ignored when user is authenticated. */
  @IsOptional()
  @IsString()
  @MinLength(1)
  guestName?: string;

  /** Token from an InviteLink URL. Required for INVITE_LINK events. */
  @IsOptional()
  @IsString()
  inviteToken?: string;
}
