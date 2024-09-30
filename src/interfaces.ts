import { Token } from './schemas';

export interface ITokens {
  accessToken: string;
  refreshToken: Token;
}

export interface IJwtPayload {
  id: string;
  email: string;
  roles: string[];
}

