import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenValueAndUserAgentDto {
  @IsString()
  @IsNotEmpty()
  value: string;

  @IsString()
  @IsNotEmpty()
  userAgent: string;
}
