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
import { IsAfterNow } from '../../../common/decorators/is-after-now.decorator';
import { EmptyToUndefined } from '../../../common/decorators/empty-to-undefined.decorator';
import { ToDate } from '../../../common/decorators/to-date.decorator';
import { Type } from 'class-transformer';

export class CreateEventDto {
  @ApiPropertyOptional()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  description?: string;

  @ApiPropertyOptional({ enum: EventType })
  @IsOptional()
  @IsEnum(EventType)
  eventType?: EventType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @EmptyToUndefined()
  location?: string;

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
  @IsIANATimezone()
  timezone!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxAttendees?: number;

  @IsDate()
  @ToDate()
  @IsAfterNow({ message: 'Start date must be in the future' })
  startAt!: Date;

  @ApiPropertyOptional({ description: 'Duration in minutes', example: 60 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration!: number;
}
