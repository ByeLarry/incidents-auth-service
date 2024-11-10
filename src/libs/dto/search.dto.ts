import { IsNotEmpty, IsString } from 'class-validator';

export class SearchDto {
  @IsNotEmpty()
  @IsString()
  query: string;

  @IsNotEmpty()
  @IsString()
  index: string;
}
