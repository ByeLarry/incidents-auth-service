import { Controller, HttpStatus } from '@nestjs/common';
import {
  AccessTokenDto,
  RefreshTokenValueAndUserAgentDto,
  SignInDto,
  SignUpDto,
} from '../libs/dto';
import { MicroserviceResponseStatusFabric } from '../libs/utils';
import { MsgAuthEnum } from '../libs/enums';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(MsgAuthEnum.SIGNUP)
  async signup(@Payload() dto: SignUpDto) {
    const user = await this.authService.signup(dto);
    if (!user) {
      return MicroserviceResponseStatusFabric.create(HttpStatus.BAD_REQUEST);
    }
    return user;
  }

  @MessagePattern(MsgAuthEnum.SIGNIN)
  async signin(@Payload() dto: SignInDto) {
    const user = await this.authService.signin(dto);
    if (!user) {
      return MicroserviceResponseStatusFabric.create(HttpStatus.BAD_REQUEST);
    }
    return user;
  }

  @MessagePattern(MsgAuthEnum.ME)
  async me(@Payload() dto: RefreshTokenValueAndUserAgentDto) {
    const user = await this.authService.me(dto);
    if (!user) {
      return MicroserviceResponseStatusFabric.create(HttpStatus.BAD_REQUEST);
    }
    return user;
  }

  @MessagePattern(MsgAuthEnum.REFRESH)
  async refresh(@Payload() dto: RefreshTokenValueAndUserAgentDto) {
    return await this.authService.refreshTokens(dto.value, dto.userAgent);
  }

  @MessagePattern(MsgAuthEnum.LOGOUT)
  async logout(@Payload() dto: RefreshTokenValueAndUserAgentDto) {
    return await this.authService.logout(dto.value);
  }

  @MessagePattern(MsgAuthEnum.AUTH)
  async auth(@Payload() dto: AccessTokenDto) {
    return await this.authService.auth(dto.value);
  }
}
