import { RefreshTokenDto } from './refresh-token.dto';

export class TokensDto {
  accessToken: string;
  refreshToken: RefreshTokenDto;
}
