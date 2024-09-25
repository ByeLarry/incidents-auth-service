import { IMicroserviceResponseStatus } from '../../interfaces';
import { HttpStatusExtends } from '../enums/extends-http-status.enum';

export class MicroserviceResponseStatusFabric {
  static create(
    status: HttpStatusExtends,
    message?: string,
  ): IMicroserviceResponseStatus {
    return {
      status,
      message,
    };
  }
}
