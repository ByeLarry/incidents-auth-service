import { HttpStatusExtends } from './libs/enums';
import { Token } from './schemas';

export interface IMicroserviceResponseStatus {
  status: HttpStatusExtends;
  message?: string;
}

export interface ITokens {
  accessToken: string;
  refreshToken: Token;
}

export interface IJwtPayload {
  id: string;
  email: string;
  roles: string[];
}
