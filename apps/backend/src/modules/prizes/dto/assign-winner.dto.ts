import { IsOptional, IsString } from 'class-validator';

export class AssignWinnerDto {
  /** Specific attendee ID. Omit for random pick. */
  @IsOptional()
  @IsString()
  attendeeId?: string;
}
