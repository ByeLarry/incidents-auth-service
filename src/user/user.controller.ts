import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { SessionIdRecvDto } from './dto/session-id-recv.dto';
import { LogoutRecvDto } from './dto/logout-recv.dto';
import { RefreshRecvDto } from './dto/refresh-recv.dto';
import { MsgAuthEnum } from 'src/utils/msg.auth.enum';
import { AuthSendDto } from './dto/auth-send.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern({ cmd: MsgAuthEnum.SIGNUP })
  signup(@Payload() data: SignUpDto) {
    return this.userService.signup(data);
  }

  @MessagePattern({ cmd: MsgAuthEnum.SIGNIN })
  signin(@Payload() data: SignInDto) {
    return this.userService.signin(data);
  }

  @MessagePattern({ cmd: MsgAuthEnum.ME })
  me(@Payload() data: SessionIdRecvDto) {
    return this.userService.me(data);
  }

  @MessagePattern({ cmd: MsgAuthEnum.REFRESH })
  refresh(@Payload() data: RefreshRecvDto) {
    return this.userService.refresh(data);
  }

  @MessagePattern({ cmd: MsgAuthEnum.LOGOUT })
  logout(@Payload() data: LogoutRecvDto) {
    return this.userService.logout(data);
  }

  @MessagePattern({ cmd: MsgAuthEnum.AUTH })
  auth(@Payload() data: AuthSendDto) {
    return this.userService.auth(data);
  }
}
