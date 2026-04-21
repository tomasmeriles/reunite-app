import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '@prisma/client';
import { IsAfterField } from '../../../common/decorators/is-after-field.decorator';

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  @IsAfterField('startAt', { message: 'End date must be after start date' })
  endAt?: string;

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
