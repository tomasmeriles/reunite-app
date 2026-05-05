import { IsBoolean, IsOptional } from 'class-validator';

export class MarkReadDto {
  @IsBoolean()
  @IsOptional()
  read?: boolean;
}
