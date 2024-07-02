export interface RefreshSendDto {
  session_id: string;
  csrf_token: string;
  message?: string;
}
