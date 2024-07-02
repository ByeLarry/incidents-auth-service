import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { SessionIdRecvDto } from './dto/session-id-recv.dto';
import { LogoutRecvDto } from './dto/logout-recv.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern({ cmd: 'signup' })
  signup(@Payload() data: SignUpDto) {
    return this.userService.signup(data);
  }

  @MessagePattern({ cmd: 'signin' })
  signin(@Payload() data: SignInDto) {
    return this.userService.signin(data);
  }

  @MessagePattern({ cmd: 'me' })
  me(@Payload() data: SessionIdRecvDto) {
    return this.userService.me(data);
  }

  @MessagePattern({ cmd: 'logout' })
  logout(@Payload() data: LogoutRecvDto) {
    return this.userService.logout(data);
  }
}
