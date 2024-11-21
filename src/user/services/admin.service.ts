import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SearchService } from '../../libs/services';
import { User, Token } from '../../schemas';
import { ResponseService } from './response.service';
import { compare, genSaltSync, hashSync } from 'bcrypt';
import {
  AddAdminDto,
  AdminLoginDto,
  CreateUserDto,
  UpdateAdminDto,
  UsersStatsDto,
} from '../../libs/dto';
import { MsgSearchEnum, RolesEnum } from '../../libs/enums';
import { handleAsyncOperation } from '../../libs/helpers';
import { MicroserviceResponseStatusFabric } from '../../libs/utils';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Token.name) private tokenModel: Model<Token>,
    private readonly searchService: SearchService,
    private readonly responseService: ResponseService,
  ) {}

  async adminLogin(data: AdminLoginDto) {
    return handleAsyncOperation(async () => {
      const user = await this.findAdminByName(data.name);
      if (!user || !(await this.isPasswordMatch(data.password, user.password))) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);
      }
      return this.responseService.createResponse(user, data.userAgent);
    });
  }

  async updateAdmin(dto: UpdateAdminDto) {
    return handleAsyncOperation(async () => {
      const user = await this.findUserById(dto.id);
      if (!user) return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);

      if (!this.isUserAdmin(user)) return MicroserviceResponseStatusFabric.create(HttpStatus.FORBIDDEN);

      if (await this.isEmailTaken(dto.email, dto.id)) {
        return MicroserviceResponseStatusFabric.create(
          HttpStatus.CONFLICT,
          'Email already exists',
        );
      }

      Object.assign(user, {
        name: dto.name.trim(),
        surname: dto.surname.trim(),
        email: dto.email.trim(),
        phone_number: dto.phone_number.trim(),
      });

      await Promise.all([
        user.save(),
        this.searchService.update(user, MsgSearchEnum.SET_USER),
      ]);

      return this.responseService.createResponse(user, dto.userAgent);
    });
  }

  async createUserByAdmin(data: CreateUserDto) {
    return handleAsyncOperation(async () => {
      if (await this.isEmailTaken(data.email)) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.CONFLICT);
      }

      const hashedPassword = this.hashPassword(data.password);
      const user = new this.userModel({
        ...data,
        name: data.name.trim(),
        surname: data.surname.trim(),
        email: data.email.trim(),
        password: hashedPassword,
      });

      await Promise.all([
        user.save(),
        this.searchService.update(user, MsgSearchEnum.SET_USER),
      ]);

      return this.responseService.createUserDto(user);
    });
  }

  async addAdminRoleToUser(data: AddAdminDto) {
    return handleAsyncOperation(async () => {
      const user = await this.findUserById(data.id);
      if (!user) return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);

      if (this.isUserAdmin(user)) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.CONFLICT);
      }

      user.roles.push(RolesEnum.ADMIN);

      await Promise.all([
        user.save(),
        this.searchService.update(user, MsgSearchEnum.SET_USER),
      ]);

      return this.responseService.createUserDto(user);
    });
  }

  async getStats() {
    return handleAsyncOperation(async () => {
      const [total, blocked, admins, activeSessions, activated] = await Promise.all([
        this.userModel.countDocuments(),
        this.userModel.countDocuments({ isBlocked: true }),
        this.userModel.countDocuments({ roles: RolesEnum.ADMIN }),
        this.tokenModel.countDocuments(),
        this.userModel.countDocuments({ activated: true }),
      ]);

      return { total, blocked, admins, activeSessions, activated } as UsersStatsDto;
    });
  }

  private async findAdminByName(name: string) {
    return this.userModel.findOne({
      name: name.trim(),
      roles: { $in: [RolesEnum.ADMIN] },
    });
  }

  private async findUserById(id: string) {
    return this.userModel.findOne({ id }).select('-password');
  }

  private async isPasswordMatch(inputPassword: string, storedPassword: string) {
    return compare(inputPassword, storedPassword);
  }

  private async isEmailTaken(email: string, excludeId?: string) {
    const query = { email: email.trim() };
    if (excludeId) query['id'] = { $ne: excludeId };
    return this.userModel.exists(query);
  }

  private hashPassword(password: string) {
    return hashSync(password, genSaltSync(10));
  }

  private isUserAdmin(user: User) {
    return user.roles.includes(RolesEnum.ADMIN);
  }
}
