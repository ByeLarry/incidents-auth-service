import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';

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

  @MessagePattern({ cmd: 'findAllUser' })
  handleMessage(data: string): string {
    console.log('Message received:', data);
    return 'Message processed!';
  }
}
