import { IsNotEmpty, IsString } from 'class-validator';

export class AccessTokenDto {
  @IsNotEmpty()
  @IsString()
  value: string;
}
