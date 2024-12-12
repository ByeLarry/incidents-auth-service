import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder } from 'mongoose';
import { compare, genSaltSync, hashSync } from 'bcrypt';
import {
  MicroserviceResponseStatusFabric,
  NO_USER_AGENT,
} from '../../libs/utils';
import {
  DeleteUserDto,
  UsersPaginationDto,
  RefreshTokenValueAndUserAgentDto,
  SignInDto,
  SignUpDto,
  UserIdDto,
  UsersViaPaginationDto,
} from '../../libs/dto';
import {
  AuthProvidersEnum,
  MsgSearchEnum,
  RolesEnum,
  UserSortEnum,
} from '../../libs/enums';
import { SearchService } from '../../libs/services';
import {
  handleAsyncOperation,
  handleAsyncOperationWithToken,
} from '../../libs/helpers';
import { Token, User } from '../../schemas';
import { ResponseService } from './response.service';

@Injectable()
export class UserService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Token.name) private tokenModel: Model<Token>,
    private readonly searchService: SearchService,
    private readonly responseService: ResponseService,
  ) {}

  private async findUserByEmail(email: string) {
    return this.userModel.findOne({ email: email.trim() });
  }

  private async findUserById(id: string) {
    return this.userModel.findOne({ id });
  }

  private async handleDuplicateRoles(user: User) {
    return user.roles.includes(RolesEnum.ADMIN);
  }

  public async signup(data: SignUpDto) {
    return handleAsyncOperation(async () => {
      const existingUser = await this.findUserByEmail(data.email);
      if (existingUser) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.CONFLICT);
      }

      const hashedPassword = hashSync(data.password, genSaltSync(10));
      const user = new this.userModel({
        ...data,
        email: data.email.trim(),
        password: hashedPassword,
      });

      await Promise.all([
        user.save(),
        this.searchService.update(user, MsgSearchEnum.SET_USER),
      ]);

      return this.responseService.createResponse(user, data.userAgent);
    });
  }

  public async signin(data: SignInDto) {
    return handleAsyncOperation(async () => {
      const user = await this.findUserByEmail(data.email);
      if (!user || user.provider !== AuthProvidersEnum.LOCAL) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);
      }

      const isMatch = await compare(data.password, user.password);
      if (!isMatch) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);
      }

      return this.responseService.createResponse(user, data.userAgent);
    });
  }

  public async me(data: RefreshTokenValueAndUserAgentDto) {
    return handleAsyncOperation(async () => {
      const token = await this.tokenModel.findOne({
        value: data.value,
        userAgent: data.userAgent || NO_USER_AGENT,
      });

      if (!token) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.UNAUTHORIZED);
      }

      const user = await this.findUserById(token.userId);
      if (!user) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);
      }

      return this.responseService.createUserDto(user);
    });
  }

  public async logout(refreshTokenValue: string) {
    return handleAsyncOperation(async () => {
      const token = await this.tokenModel.findOne({ value: refreshTokenValue });
      if (!token) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.UNAUTHORIZED);
      }
      await token.deleteOne();
      return MicroserviceResponseStatusFabric.create(HttpStatus.NO_CONTENT);
    });
  }

  public async deleteUser(dto: DeleteUserDto) {
    return handleAsyncOperationWithToken(async () => {
      const user = await this.findUserById(dto.userId);
      if (!user) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);
      }

      const payload = this.jwtService.verify(dto.accessTokenValue);
      if (
        payload.id !== dto.userId &&
        !payload.roles.includes(RolesEnum.ADMIN)
      ) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.FORBIDDEN);
      }

      if (await this.handleDuplicateRoles(user)) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.CONFLICT);
      }

      await Promise.all([
        this.tokenModel.deleteMany({ userId: user.id }),
        user.deleteOne(),
        this.searchService.update(user, MsgSearchEnum.DELETE_USER),
      ]);

      return this.responseService.createUserDto(user);
    });
  }

  public async getAllUsersWithPagination(dto: UsersPaginationDto) {
    return handleAsyncOperation(async () => {
      const skip = (dto.page - 1) * dto.limit;
      const sortKey: UserSortEnum = dto.sort;
      const total = await this.userModel.countDocuments();
      const users = await this.userModel
        .find(
          {},
          {},
          {
            skip,
            limit: dto.limit,
          },
        )
        .sort(this.getSortOrder(sortKey))
        .select('-password -_id -__v');

      const usersWithTokenCount = await Promise.all(
        users.map(async (user) => ({
          ...user.toObject(),
          tokensCount: await this.tokenModel.countDocuments({
            userId: user.id,
          }),
        })),
      );

      return {
        total,
        page: dto.page,
        limit: dto.limit,
        users: usersWithTokenCount,
      } as UsersViaPaginationDto;
    });
  }

  public async blockUser(dto: UserIdDto) {
    return handleAsyncOperation(async () => {
      const user = await this.findUserById(dto.id);
      if (!user) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);
      }
      if (!user || (await this.handleDuplicateRoles(user))) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.CONFLICT);
      }
      user.isBlocked = true;
      await user.save();
      await this.tokenModel.deleteMany({ userId: dto.id });
      return this.responseService.createUserDto(user);
    });
  }

  public async unblockUser(dto: UserIdDto) {
    return handleAsyncOperation(async () => {
      const user = await this.findUserById(dto.id);
      if (!user) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);
      }
      user.isBlocked = false;
      await user.save();
      return this.responseService.createUserDto(user);
    });
  }

  private getSortOrder(
    sortKey: UserSortEnum,
  ):
    | string
    | { [key: string]: SortOrder | { $meta: any } }
    | [string, SortOrder][] {
    switch (sortKey) {
      case UserSortEnum.CREATED_AT_ASC:
        return { createdAt: 1 };
      case UserSortEnum.CREATED_AT_DESC:
        return { createdAt: -1 };
      default:
        return { createdAt: -1 };
    }
  }
}
