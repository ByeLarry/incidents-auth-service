import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MsgAuthEnum } from '../libs/enums';
import { SessionAuthService } from './session-auth.service';
import {
  AuthAndLogoutDto,
  SessionIdFromCookieDto,
  SignInDto,
  SignUpDto,
} from '../libs/dto';

@Controller()
export class SessionAuthController {
  constructor(private readonly sessionAuthService: SessionAuthService) {}

  @MessagePattern(MsgAuthEnum.SIGNUP)
  signup(@Payload() data: SignUpDto) {
    return this.sessionAuthService.signup(data);
  }

  @MessagePattern(MsgAuthEnum.SIGNIN)
  signin(@Payload() data: SignInDto) {
    return this.sessionAuthService.signin(data);
  }

  @MessagePattern(MsgAuthEnum.ME)
  me(@Payload() data: SessionIdFromCookieDto) {
    return this.sessionAuthService.me(data);
  }

  @MessagePattern(MsgAuthEnum.REFRESH)
  refresh(@Payload() data: SessionIdFromCookieDto) {
    return this.sessionAuthService.refresh(data);
  }

  @MessagePattern(MsgAuthEnum.LOGOUT)
  logout(@Payload() data: AuthAndLogoutDto) {
    return this.sessionAuthService.logout(data);
  }

  @MessagePattern(MsgAuthEnum.AUTH)
  auth(@Payload() data: AuthAndLogoutDto) {
    return this.sessionAuthService.auth(data);
  }
}
