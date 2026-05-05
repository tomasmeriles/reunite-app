import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsStrongPassword,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'juanperez',
    description:
      'Unique @username (3-30 chars, lowercase letters, numbers and underscores)',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9_]+$/, {
    message:
      'username can only contain lowercase letters, numbers and underscores',
  })
  username!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'S3cur3P@ss!' })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password!: string;
}
