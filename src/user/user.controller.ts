import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { MsgAuthEnum } from '../utils/msg.auth.enum';
import { AuthAndLogoutDto } from './dto/authAndLogout.dto';
import { SessionIdFromCookieDto } from './dto/sessionIdFromCookie.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern(MsgAuthEnum.SIGNUP)
  signup(@Payload() data: SignUpDto) {
    return this.userService.signup(data);
  }

  @MessagePattern(MsgAuthEnum.SIGNIN)
  signin(@Payload() data: SignInDto) {
    return this.userService.signin(data);
  }

  @MessagePattern(MsgAuthEnum.ME)
  me(@Payload() data: SessionIdFromCookieDto) {
    return this.userService.me(data);
  }

  @MessagePattern(MsgAuthEnum.REFRESH)
  refresh(@Payload() data: SessionIdFromCookieDto) {
    return this.userService.refresh(data);
  }

  @MessagePattern(MsgAuthEnum.LOGOUT)
  logout(@Payload() data: AuthAndLogoutDto) {
    return this.userService.logout(data);
  }

  @MessagePattern(MsgAuthEnum.AUTH)
  auth(@Payload() data: AuthAndLogoutDto) {
    return this.userService.auth(data);
  }
}
