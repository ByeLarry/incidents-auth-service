import { IsNotEmpty, IsString } from 'class-validator';

export class SessionIdDto {
  @IsString()
  @IsNotEmpty()
  session_id: string;
}
