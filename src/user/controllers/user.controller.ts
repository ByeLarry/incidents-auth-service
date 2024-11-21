import { Controller, HttpStatus } from '@nestjs/common';
import {
  DeleteUserDto,
  PaginationDto,
  RefreshTokenValueAndUserAgentDto,
  SignInDto,
  SignUpDto,
  UserIdDto,
} from '../../libs/dto';
import { MicroserviceResponseStatusFabric } from '../../libs/utils';
import { MsgAuthEnum } from '../../libs/enums';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from '../services';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern(MsgAuthEnum.SIGNUP)
  async signup(@Payload() dto: SignUpDto) {
    const user = await this.userService.signup(dto);
    if (!user) {
      return MicroserviceResponseStatusFabric.create(HttpStatus.BAD_REQUEST);
    }
    return user;
  }

  @MessagePattern(MsgAuthEnum.SIGNIN)
  async signin(@Payload() dto: SignInDto) {
    const user = await this.userService.signin(dto);
    if (!user) {
      return MicroserviceResponseStatusFabric.create(HttpStatus.BAD_REQUEST);
    }
    return user;
  }

  @MessagePattern(MsgAuthEnum.ME)
  async me(@Payload() dto: RefreshTokenValueAndUserAgentDto) {
    const user = await this.userService.me(dto);
    if (!user) {
      return MicroserviceResponseStatusFabric.create(HttpStatus.BAD_REQUEST);
    }
    return user;
  }

  @MessagePattern(MsgAuthEnum.LOGOUT)
  async logout(@Payload() dto: RefreshTokenValueAndUserAgentDto) {
    return await this.userService.logout(dto.value);
  }

  @MessagePattern(MsgAuthEnum.DELETE)
  async deleteUser(@Payload() dto: DeleteUserDto) {
    return await this.userService.deleteUser(dto);
  }

  @MessagePattern(MsgAuthEnum.GET_ALL_USERS)
  async getAllUsers(@Payload() dto: PaginationDto) {
    return await this.userService.getAllUsers(dto);
  }

  @MessagePattern(MsgAuthEnum.BLOCK_USER)
  async blockUser(@Payload() dto: UserIdDto) {
    return await this.userService.blockUser(dto);
  }

  @MessagePattern(MsgAuthEnum.UNBLOCK_USER)
  async unblockUser(@Payload() dto: UserIdDto) {
    return await this.userService.unblockUser(dto);
  }
}
