import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { AttendeeAccess, MediaAccess } from '@prisma/client';

export class UpdateEventConfigDto {
  @IsOptional()
  @IsEnum(AttendeeAccess)
  attendeeAccess?: AttendeeAccess;

  @IsOptional()
  @IsEnum(MediaAccess)
  mediaAccess?: MediaAccess;

  @IsOptional()
  @IsBoolean()
  registrationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  prizesEnabled?: boolean;
}
