import { Controller } from '@nestjs/common';
import { AdminService } from '../services';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AdminLoginDto,
  UpdateAdminDto,
  CreateUserDto,
  AddAdminDto,
} from '../../libs/dto';
import { MsgAuthEnum } from '../../libs/enums';

@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @MessagePattern(MsgAuthEnum.ADMIN_LOGIN)
  async adminLogin(@Payload() dto: AdminLoginDto) {
    return await this.adminService.adminLogin(dto);
  }

  @MessagePattern(MsgAuthEnum.UPDATE_ADMIN)
  async updateAdmin(@Payload() dto: UpdateAdminDto) {
    return await this.adminService.updateAdmin(dto);
  }

  @MessagePattern(MsgAuthEnum.CREATE_USER_BY_ADMIN)
  async createUserByAdmin(@Payload() dto: CreateUserDto) {
    return await this.adminService.createUserByAdmin(dto);
  }

  @MessagePattern(MsgAuthEnum.ADD_ADMIN_ROLE_TO_USER)
  async addAdminRoleToUser(@Payload() dto: AddAdminDto) {
    return await this.adminService.addAdminRoleToUser(dto);
  }

  @MessagePattern(MsgAuthEnum.USERS_STATS)
  async getStats() {
    return await this.adminService.getStats();
  }
}
