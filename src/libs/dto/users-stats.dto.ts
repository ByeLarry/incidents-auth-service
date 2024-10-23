import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UsersStatsDto {
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  total: number;

  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  admins: number;

  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  activeSessions: number;

  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  blocked: number;

  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  activated: number;
}
