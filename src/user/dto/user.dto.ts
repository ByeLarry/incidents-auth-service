export interface UserDto {
  name: string;
  surname: string;
  email: string;
  _id: string;
  activated: boolean;
  csrf_token: string;
  session_id: string;
}
