import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator';

export class ClaimGuestSessionsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(50)
  guestTokens!: string[];
}
