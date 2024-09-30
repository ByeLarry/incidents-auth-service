import { HttpStatus } from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';

export class MicroserviceResponseStatus {
  @IsNotEmpty()
  status: HttpStatus;

  @IsString()
  message?: string;
}
