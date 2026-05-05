import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CreatePrizeDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}
