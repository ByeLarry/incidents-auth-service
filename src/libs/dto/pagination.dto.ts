import { IsOptional, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  @IsPositive()
  readonly page?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  @IsPositive()
  readonly limit?: number;
}
