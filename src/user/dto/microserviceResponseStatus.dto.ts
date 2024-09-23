import { HttpStatusExtends } from '../../utils/extendsHttpStatus.enum';

export interface MicroserviceResponseStatus {
  status: HttpStatusExtends;
  message?: string;
}
