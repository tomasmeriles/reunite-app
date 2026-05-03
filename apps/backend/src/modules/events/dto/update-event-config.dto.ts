import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { AttendeeAccess, MediaAccess } from '@prisma/client';

export class UpdateEventConfigDto {
  @IsOptional()
  @IsEnum(AttendeeAccess)
  attendeeAccess?: AttendeeAccess;

  @IsOptional()
  @IsBoolean()
  chatEnabled?: boolean;

  @IsOptional()
  @IsEnum(MediaAccess)
  mediaAccess?: MediaAccess;

  @IsOptional()
  @IsBoolean()
  prizesEnabled?: boolean;
}
