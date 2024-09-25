import { IsNotEmpty, IsString } from 'class-validator';

export class SessionIdFromCookieDto {
  @IsString()
  @IsNotEmpty()
  session_id_from_cookie: string;
}
