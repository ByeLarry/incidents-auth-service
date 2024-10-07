import { IsArray, IsEmail, IsNotEmpty, IsString } from "class-validator";

export class JwtAuthDto {
    @IsNotEmpty()
    @IsString()
    id: string

    @IsNotEmpty()
    @IsString()
    @IsEmail()
    email: string

    @IsNotEmpty()
    @IsArray()
    roles: string[]
}