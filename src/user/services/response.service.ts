import { Injectable } from '@nestjs/common';
import { User } from '../../schemas';
import { MicroserviceResponseStatus, UserDto } from '../../libs/dto';
import { UserAndTokensDto } from '../../libs/dto/user-and-tokens.dto';
import { TokenService } from './token.service';

@Injectable()
export class ResponseService {
  constructor(private readonly tokenService: TokenService) {}

  public async createResponse(
    user: User,
    userAgent: string,
  ): Promise<MicroserviceResponseStatus | UserAndTokensDto> {
    const userSendDto = this.createUserDto(user);
    const tokensOrError = await this.tokenService.generateTokens(
      user,
      userAgent,
    );
    if (tokensOrError instanceof MicroserviceResponseStatus) {
      return tokensOrError;
    }
    const response: UserAndTokensDto = {
      user: userSendDto,
      tokens: tokensOrError,
    };
    return response;
  }

  public createUserDto(data: User): UserDto {
    return {
      name: data.name?.trim(),
      surname: data.surname?.trim(),
      email: data.email?.trim(),
      id: data.id?.trim(),
      phone_number: data.phone_number?.trim(),
      activated: data.activated,
      roles: data.roles,
      provider: data.provider,
    };
  }
}
