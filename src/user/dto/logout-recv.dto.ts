export interface LogoutRecvDto {
  session_id_from_cookie: string;
  csrf_token: string;
}
