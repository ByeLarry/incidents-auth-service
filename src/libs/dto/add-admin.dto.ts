import { IsNotEmpty, IsString } from 'class-validator';

export class AddAdminDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}
