import { IsBoolean, IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { TokensDto } from './tokens.dto';
import { Type } from 'class-transformer';

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
  csrf_token?: string;

  @IsString()
  session_id?: string;

  @Type(() => TokensDto)
  tokens?: TokensDto;
}
