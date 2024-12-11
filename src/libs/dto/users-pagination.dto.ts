import { IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserSortEnum } from '../enums';

export class UsersPaginationDto {
  @IsNotEmpty()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  @IsPositive()
  readonly page: number;

  @IsNotEmpty()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  @IsPositive()
  readonly limit: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => UserSortEnum[value], { toClassOnly: true })
  readonly sort?: UserSortEnum;
}
