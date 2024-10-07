import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';
import { RolesEnum } from '../../libs/enums';
import { AuthProvidersEnum } from '../../libs/enums/auth-providers.enum';

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
}
