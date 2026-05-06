import {
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { IsIANATimezone } from '../../../common/decorators/is-iana-timezone.decorator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '@prisma/client';
import { ToDate } from '../../../common/decorators/to-date.decorator';
import { Type } from 'class-transformer';
import { IsAfterNow } from '../../../common/decorators/is-after-now.decorator';

export class UpdateEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: EventType })
  @IsOptional()
  @IsEnum(EventType)
  eventType?: EventType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Formatted address from Google Places' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Google Place ID' })
  @IsOptional()
  @IsString()
  placeId?: string;

  @ApiPropertyOptional({ description: 'WGS-84 latitude', example: 40.7128 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'WGS-84 longitude', example: -74.006 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'IANA timezone, e.g. America/New_York' })
  @IsOptional()
  @IsIANATimezone()
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @ToDate()
  @IsAfterNow({ message: 'Start date must be in the future' })
  startAt?: Date;

  @ApiPropertyOptional({ description: 'Duration in minutes', example: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttendees?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preEventText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postEventText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  previousEventId?: string;
}
