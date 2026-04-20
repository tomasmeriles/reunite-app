import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateEventConfigDto {
  @IsOptional()
  @IsBoolean()
  attendeesPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  chatEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  mediaEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  prizesEnabled?: boolean;
}
