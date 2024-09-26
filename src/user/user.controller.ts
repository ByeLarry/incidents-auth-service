import { Body, Controller, Param, ParseUUIDPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { IJwtPayload } from '../interfaces';
import { UserDto } from '../libs/dto';
import { MicroserviceResponseStatusFabric } from '../libs/utils';
import { HttpStatusExtends } from '../libs/enums';
import { User } from '../schemas';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  async findOneUser(@Param('idOrEmail') idOrEmail: string) {
    const user = await this.userService.findOne(idOrEmail);
    if (!user) {
      return MicroserviceResponseStatusFabric.create(
        HttpStatusExtends.NOT_FOUND,
      );
    }
    const response: UserDto = {
      _id: user.toString(),
      name: user.name,
      surname: user.surname,
      email: user.email,
      activated: user.activated,
      roles: user.roles,
    };
    return response;
  }

  async deleteUser(@Param('id', ParseUUIDPipe) id: string, user: IJwtPayload) {
    return this.userService.delete(id, user);
  }

  me(user: IJwtPayload) {
    return user;
  }

  async updateUser(@Body() body: Partial<User>) {
    const user = await this.userService.save(body);
    const response: UserDto = {
      _id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      activated: user.activated,
      roles: user.roles,
    };
    return response;
  }
}
