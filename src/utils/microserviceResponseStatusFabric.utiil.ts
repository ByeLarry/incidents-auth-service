import { MicroserviceResponseStatus } from '../user/dto/microserviceResponseStatus.dto';
import { HttpStatusExtends } from './extendsHttpStatus.enum';

export class MicroserviceResponseStatusFabric {
  static create(
    status: HttpStatusExtends,
    message?: string,
  ): MicroserviceResponseStatus {
    return {
      status,
      message,
    };
  }
}
