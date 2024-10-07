import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthProvidersDto {
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @IsString()
  name?: string;

  @IsString()
  surname?: string;
}
