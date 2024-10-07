import { IsNotEmpty } from 'class-validator';
import { RolesEnum } from '../../libs/enums';

export class UserRolesDto {
  @IsNotEmpty()
  roles: RolesEnum[];
}
