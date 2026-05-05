import { IsDate, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ToDate } from '../../../common/decorators/to-date.decorator';
import { IsAfterNow } from '../../../common/decorators/is-after-now.decorator';

export class CreateInviteLinkDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  @IsDate()
  @ToDate()
  @IsAfterNow({ message: 'Expiration date must be in the future' })
  expiresAt?: Date;

  @IsOptional()
  @IsString()
  label?: string;
}
