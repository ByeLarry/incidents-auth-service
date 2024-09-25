import { RefreshTokenDto } from './refreshToken.dto';

export class TokensDto {
  accessToken: string;
  refreshToken: RefreshTokenDto;
}
