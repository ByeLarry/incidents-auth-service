import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Token.name) private tokenModel: Model<Token>,
    private readonly searchService: SearchService,
    private readonly responseService: ResponseService,
  ) {}

  async adminLogin(data: AdminLoginDto) {
    return await handleAsyncOperation(async () => {
      const user = await this.userModel.findOne({
        name: data.name.trim(),
        roles: { $in: [RolesEnum.ADMIN] },
      });
      if (!user) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);
      }
      const isMatch = await compare(data.password, user.password);
      if (!isMatch) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);
      }
      const response = await this.responseService.createResponse(
        user,
        data.userAgent,
      );
      return response;
    });
  }

  async updateAdmin(dto: UpdateAdminDto) {
    return await handleAsyncOperation(async () => {
      const user = await this.userModel
        .findOne({ id: dto.id })
        .select('-password');
      if (!user)
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);

      if (!user.roles.includes(RolesEnum.ADMIN))
        return MicroserviceResponseStatusFabric.create(HttpStatus.FORBIDDEN);

      const emailExists = await this.userModel.findOne({
        email: dto.email,
        id: { $ne: dto.id },
      });
      if (emailExists) {
        return MicroserviceResponseStatusFabric.create(
          HttpStatus.CONFLICT,
          'Email already exists',
        );
      }

      user.name = dto.name.trim();
      user.surname = dto.surname.trim();
      user.email = dto.email.trim();
      user.phone_number = dto.phone_number.trim();

      Promise.all([
        user.save(),
        this.searchService.update(user, MsgSearchEnum.SET_USER),
      ]);

      return this.responseService.createResponse(user, dto.userAgent);
    });
  }

  async createUserByAdmin(data: CreateUserDto) {
    return await handleAsyncOperation(async () => {
      const hashedPassword = hashSync(data.password, genSaltSync(10));

      const existingUser = await this.userModel.findOne({
        email: data.email.trim(),
      });
      if (existingUser) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.CONFLICT);
      }
      const user = new this.userModel({
        name: data.name.trim(),
        surname: data.surname.trim(),
        email: data.email.trim(),
        password: hashedPassword,
      });

      Promise.all([
        user.save(),
        this.searchService.update(user, MsgSearchEnum.SET_USER),
      ]);

      const response = this.responseService.createUserDto(user);
      return response;
    });
  }

  async addAdminRoleToUser(data: AddAdminDto) {
    return await handleAsyncOperation(async () => {
      const user = await this.userModel
        .findOne({ id: data.id })
        .select('-password');

      if (!user)
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);

      if (user.roles.includes(RolesEnum.ADMIN))
        return MicroserviceResponseStatusFabric.create(HttpStatus.CONFLICT);

      user.roles.push(RolesEnum.ADMIN);

      Promise.all([
        user.save(),
        this.searchService.update(user, MsgSearchEnum.SET_USER),
      ]);

      return this.responseService.createUserDto(user);
    });
  }

  async getStats() {
    return await handleAsyncOperation(async () => {
      const total = await this.userModel.countDocuments();
      const blocked = await this.userModel.countDocuments({
        isBlocked: true,
      });
      const admins = await this.userModel.countDocuments({
        roles: RolesEnum.ADMIN,
      });
      const activeSessions = await this.tokenModel.countDocuments();
      const activated = await this.userModel.countDocuments({
        activated: true,
      });
      const response: UsersStatsDto = {
        total,
        blocked,
        admins,
        activeSessions,
        activated,
      };

      return response;
    });
  }
}
