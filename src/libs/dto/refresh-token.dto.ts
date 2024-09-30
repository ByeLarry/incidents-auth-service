import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  value: string;

  @IsDate()
  @IsNotEmpty()
  exp: Date;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
