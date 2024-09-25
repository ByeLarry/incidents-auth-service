import { IsNotEmpty, IsString } from 'class-validator';

export class AuthAndLogoutDto {
  @IsString()
  @IsNotEmpty()
  session_id_from_cookie: string;

  @IsString()
  @IsNotEmpty()
  csrf_token: string;
}
