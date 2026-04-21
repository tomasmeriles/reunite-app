import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '@prisma/client';
import { IsAfterField } from '../../../common/decorators/is-after-field.decorator';
import { EmptyToUndefined } from '../../../common/decorators/empty-to-undefined.decorator';

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

  @IsDateString()
  startAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  @IsAfterField('startAt', { message: 'End date must be after start date' })
  endAt?: string;
}
