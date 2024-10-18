import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class UpdateAdminDto {
  @IsString()
  @IsNotEmpty()
  id: string;

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
  @IsPhoneNumber('RU')
  phone_number: string;

  @IsString()
  @IsNotEmpty()
  userAgent: string;
}
