import { Controller } from '@nestjs/common';
import { JwtAuthService } from './jwt-auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MsgAuthEnum } from '../lib/enums';
import { SignInDto, SignUpDto } from '../lib/dto';

/**
 * @deprecated
 */
@Controller()
export class JwtAuthController {
  constructor(private readonly jwtAuthService: JwtAuthService) {}

  @MessagePattern(MsgAuthEnum.SIGNUP)
  register(@Payload() data: SignUpDto) {
    return this.jwtAuthService.register(data);
  }

  @MessagePattern(MsgAuthEnum.SIGNIN)
  login(@Payload() data: SignInDto) {
    return this.jwtAuthService.login(data);
  }
}
