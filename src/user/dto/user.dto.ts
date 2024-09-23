import { IsBoolean, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  surname: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  _id: string;

  @IsBoolean()
  @IsNotEmpty()
  activated: boolean;

  @IsString()
  @IsNotEmpty()
  csrf_token: string;

  @IsString()
  @IsNotEmpty()
  session_id: string;
}
