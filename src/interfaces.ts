import { HttpStatusExtends } from './lib/enums';

export interface IMicroserviceResponseStatus {
  status: HttpStatusExtends;
  message?: string;
}

export interface ITokens {
  accessToken: string;
  refreshToken: string;
}
