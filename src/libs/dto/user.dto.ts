import { ITokens } from '../../interfaces';
import { RolesEnum } from '../enums';
import { AuthProvidersEnum } from '../enums/auth-providers.enum';

export class UserDto {
  name: string;
  surname: string;
  email: string;
  _id: string;
  activated: boolean;
  csrf_token?: string;
  session_id?: string;
  tokens?: ITokens;
  roles?: RolesEnum[];
  provider?: AuthProvidersEnum[];
}
