import { ITokens } from '../../interfaces';
import { UserDto } from './user.dto';

export class UserAndTokensDto {
  user: UserDto;
  tokens: ITokens;
}
