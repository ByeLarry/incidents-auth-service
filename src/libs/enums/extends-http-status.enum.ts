import { HttpStatus } from '@nestjs/common';

export enum HttpStatusExtends {
  // For this status code, HttpStatusExtends was created
  SESSION_EXPIRED = 419,
  OK = HttpStatus.OK,
  NOT_FOUND = HttpStatus.NOT_FOUND,
  INTERNAL_SERVER_ERROR = HttpStatus.INTERNAL_SERVER_ERROR,
  BAD_REQUEST = HttpStatus.BAD_REQUEST,
  FORBIDDEN = HttpStatus.FORBIDDEN,
  UNAUTHORIZED = HttpStatus.UNAUTHORIZED,
  CONFLICT = HttpStatus.CONFLICT,
  TOO_MANY_REQUESTS = HttpStatus.TOO_MANY_REQUESTS,
  CREATED = HttpStatus.CREATED,
  UNPROCESSABLE_ENTITY = HttpStatus.UNPROCESSABLE_ENTITY,
  NO_CONTENT = HttpStatus.NO_CONTENT,
}
