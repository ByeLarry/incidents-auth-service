import { IsArray, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
import { UserDto } from './user.dto';
import { Transform, Type } from 'class-transformer';

export class UsersViaPaginationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserDto)
  users: UserDto[];

  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  total: number;

  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  page: number;

  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  limit: number;
}
