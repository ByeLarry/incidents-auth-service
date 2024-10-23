import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
} from 'class-validator';
import { RolesEnum } from '../../libs/enums';
import { AuthProvidersEnum } from '../../libs/enums/auth-providers.enum';
import { Transform } from 'class-transformer';

export class UserDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  surname: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Length(3, 100)
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(0, 100)
  id: string;

  @IsBoolean()
  @IsNotEmpty()
  activated: boolean;

  @IsNotEmpty()
  roles: RolesEnum[];

  @IsNotEmpty()
  provider: AuthProvidersEnum;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  tokensCount?: number;

  @IsOptional()
  @IsString()
  @IsPhoneNumber('RU')
  phone_number?: string;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  createdAt?: Date;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value), { toClassOnly: true })
  updatedAt?: Date;
}
