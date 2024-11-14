import { HttpStatus, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { add } from 'date-fns';
import { v4 } from 'uuid';
import { IJwtPayload, ITokens } from '../interfaces';
import { Token, User } from '../schemas';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { MicroserviceResponseStatusFabric, NO_USER_AGENT } from '../libs/utils';
import {
  AddAdminDto,
  AdminLoginDto,
  AuthProvidersDto,
  CreateUserDto,
  DeleteUserDto,
  JwtAuthDto,
  MicroserviceResponseStatus,
  PaginationDto,
  RefreshTokenValueAndUserAgentDto,
  SignInDto,
  SignUpDto,
  UpdateAdminDto,
  UserDto,
  UserIdDto,
  UserRolesDto,
  UserSearchDto,
  UsersStatsDto,
  UsersViaPaginationDto,
} from '../libs/dto';
import { UserAndTokensDto } from '../libs/dto/user-and-tokens.dto';
import { genSaltSync, hashSync } from 'bcrypt';
import { AuthProvidersEnum, MsgSearchEnum, RolesEnum } from '../libs/enums';
import { SearchService } from '../libs/services';
import { isArray } from 'class-validator';

type AsyncFunction<T> = () => Promise<T>;

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Token.name) private tokenModel: Model<Token>,
    private readonly searchService: SearchService,
  ) {}

  private async handleAsyncOperation<T>(
    operation: AsyncFunction<T>,
  ): Promise<T | MicroserviceResponseStatus> {
    try {
      return await operation();
    } catch (error) {
      console.log(error);
      return MicroserviceResponseStatusFabric.create(
        HttpStatus.INTERNAL_SERVER_ERROR,
        error,
      );
    }
  }

  private async handleAsyncOperationWithToken<T>(
    operation: AsyncFunction<T>,
  ): Promise<T | MicroserviceResponseStatus> {
    try {
      return await operation();
    } catch (error) {
      console.log(error);
      if (error.name === 'JsonWebTokenError') {
        return MicroserviceResponseStatusFabric.create(HttpStatus.UNAUTHORIZED);
      }
      if (error.name === 'TokenExpiredError') {
        return MicroserviceResponseStatusFabric.create(HttpStatus.UNAUTHORIZED);
      }
      return MicroserviceResponseStatusFabric.create(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async onApplicationBootstrap() {
    this.reindexSearhchEngine();
  }

  public async signup(data: SignUpDto) {
    return await this.handleAsyncOperation(async () => {
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

      const response = await this.createResponse(user, data.userAgent);
      return response;
    });
  }

  public async signin(data: SignInDto) {
    return await this.handleAsyncOperation(async () => {
      const user = await this.userModel.findOne({ email: data.email });
      if (!user) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);
      }
      if (user.provider !== AuthProvidersEnum.LOCAL) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.CONFLICT);
      }
      const isMatch = hashSync(data.password, genSaltSync(10));
      if (!isMatch) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.UNAUTHORIZED);
      }
      const response = await this.createResponse(user, data.userAgent);
      return response;
    });
  }

  public async me(data: RefreshTokenValueAndUserAgentDto) {
    return await this.handleAsyncOperation(async () => {
      const token = await this.tokenModel.findOne({
        value: data.value,
        userAgent: data.userAgent || NO_USER_AGENT,
      });
      if (!token) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.UNAUTHORIZED);
      }
      const user = await this.userModel.findOne({
        id: token.userId,
      });
      if (!user) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);
      }

      return this.createUserDto(user);
    });
  }

  async refreshTokens(refreshTokenValue: string, agent: string) {
    return await this.handleAsyncOperation(async () => {
      const token = await this.tokenModel.findOne({ value: refreshTokenValue });
      if (!token || new Date(token.exp) < new Date()) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.UNAUTHORIZED);
      }

      await token.deleteOne();
      const user = await this.userModel.findOne({ id: token.userId });

      if (!user) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);
      }

      return this.generateTokens(user, agent);
    });
  }

  public async logout(refreshTokenValue: string) {
    return await this.handleAsyncOperation(async () => {
      const token = await this.tokenModel.findOne({ value: refreshTokenValue });
      if (!token) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.UNAUTHORIZED);
      }
      await token.deleteOne();
      return MicroserviceResponseStatusFabric.create(HttpStatus.NO_CONTENT);
    });
  }

  public async jwtAuth(data: JwtAuthDto) {
    return this.handleAsyncOperation(async () => {
      const user = await this.userModel.findOne({
        email: data.email,
        id: data.id,
        roles: data.roles,
      });
      if (!user) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);
      }
      if (user.isBlocked)
        return MicroserviceResponseStatusFabric.create(HttpStatus.FORBIDDEN);
      const response: UserDto = {
        name: user.name.trim(),
        surname: user.surname.trim(),
        email: user.email.trim(),
        id: user.id.trim(),
        activated: user.activated,
        roles: user.roles,
        provider: user.provider,
      };
      return response;
    });
  }

  public async deleteUser(dto: DeleteUserDto) {
    return await this.handleAsyncOperationWithToken(async () => {
      const user = await this.userModel
        .findOne({ id: dto.userId })
        .select('-password -__v');

      if (!user)
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);

      const payload = this.jwtService.verify<IJwtPayload>(dto.accessTokenValue);
      if (payload.id !== dto.userId && !payload.roles.includes(RolesEnum.ADMIN))
        return MicroserviceResponseStatusFabric.create(HttpStatus.FORBIDDEN);

      if (user.roles.includes(RolesEnum.ADMIN))
        return MicroserviceResponseStatusFabric.create(HttpStatus.CONFLICT);

      Promise.all([
        this.tokenModel.deleteMany({ userId: user.id }),
        user.deleteOne(),
        this.searchService.update(user, MsgSearchEnum.DELETE_USER),
      ]);

      const result = this.createUserDto(user);
      return result;
    });
  }

  public async userRoles(accessTokenValue: string) {
    return await this.handleAsyncOperationWithToken(async () => {
      const payload = this.jwtService.verify<IJwtPayload>(accessTokenValue);
      const user = await this.userModel.findOne({ id: payload.id });

      if (!user)
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);

      const response: UserRolesDto = {
        roles: user.roles,
      };
      return response;
    });
  }

  public async authByProviders(
    data: AuthProvidersDto,
    provider: AuthProvidersEnum,
  ) {
    return await this.handleAsyncOperation(async () => {
      const userExist = await this.userModel.findOne({
        email: data.email,
      });
      if (userExist) {
        if (userExist.isBlocked)
          return MicroserviceResponseStatusFabric.create(
            HttpStatus.FORBIDDEN,
            'User is blocked',
          );
        if (
          userExist.provider === AuthProvidersEnum.LOCAL ||
          userExist.provider !== provider
        )
          return MicroserviceResponseStatusFabric.create(HttpStatus.CONFLICT);

        return this.createResponse(userExist, data.userAgent);
      }
      const user = await this.userModel.create({
        name: data.name.trim(),
        surname: data.surname.trim(),
        email: data.email.trim(),
        provider,
      });

      if (!user)
        return MicroserviceResponseStatusFabric.create(HttpStatus.BAD_REQUEST);

      await this.searchService.update(user, MsgSearchEnum.SET_USER);

      return this.createResponse(user, data.userAgent);
    });
  }

  async adminLogin(data: AdminLoginDto) {
    return await this.handleAsyncOperation(async () => {
      const user = await this.userModel.findOne({
        name: data.name.trim(),
        roles: { $in: [RolesEnum.ADMIN] },
      });
      if (!user) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);
      }
      const isMatch = hashSync(data.password, genSaltSync(10));
      if (!isMatch) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.UNAUTHORIZED);
      }
      const response = await this.createResponse(user, data.userAgent);
      return response;
    });
  }

  private async generateTokens(
    user: User,
    agent: string,
  ): Promise<ITokens | MicroserviceResponseStatus> {
    const accessToken =
      'Bearer ' +
      this.jwtService.sign({
        id: user.id,
        email: user.email.trim(),
        roles: user.roles,
      });
    const refreshToken = await this.getRefreshToken(user, agent);
    if (refreshToken instanceof MicroserviceResponseStatus) {
      return refreshToken;
    }
    return { accessToken, refreshToken };
  }

  private async getRefreshToken(
    user: User,
    agent: string,
  ): Promise<Token | MicroserviceResponseStatus> {
    return await this.handleAsyncOperation(async () => {
      const token = await this.tokenModel.findOneAndUpdate(
        { userId: user.id, userAgent: agent || NO_USER_AGENT },
        {
          userId: user.id.trim(),
          value: v4(),
          exp: add(new Date(), { months: 1 }),
          userAgent: agent.trim() || NO_USER_AGENT,
        },
        { new: true, upsert: true },
      );

      return token;
    });
  }

  private async createResponse(
    user: User,
    userAgent: string,
  ): Promise<MicroserviceResponseStatus | UserAndTokensDto> {
    const userSendDto = this.createUserDto(user);
    const tokensOrError = await this.generateTokens(user, userAgent);
    if (tokensOrError instanceof MicroserviceResponseStatus) {
      return tokensOrError;
    }
    const response: UserAndTokensDto = {
      user: userSendDto,
      tokens: tokensOrError,
    };
    return response;
  }

  private createUserDto(data: User): UserDto {
    return {
      name: data.name?.trim(),
      surname: data.surname?.trim(),
      email: data.email?.trim(),
      id: data.id?.trim(),
      phone_number: data.phone_number?.trim(),
      activated: data.activated,
      roles: data.roles,
      provider: data.provider,
    };
  }

  async getAllUsers(dto: PaginationDto) {
    return await this.handleAsyncOperation(async () => {
      const skip = (dto.page - 1) * dto.limit;
      const total = await this.userModel.countDocuments();

      const users = await this.userModel
        .find({}, {}, { skip, limit: dto.limit, sort: { createdAt: 1 } })
        .select('-password -_id -__v');

      const usersWithTokenCount = await Promise.all(
        users.map(async (user) => {
          const userObj: UserDto = user.toObject();

          const tokensCount = await this.tokenModel.countDocuments({
            userId: user.id,
          });

          userObj.tokensCount = tokensCount;

          return userObj;
        }),
      );

      const response: UsersViaPaginationDto = {
        total,
        page: Number(dto.page),
        limit: Number(dto.limit),
        users: usersWithTokenCount,
      };

      return response;
    });
  }

  async blockUser(dto: UserIdDto) {
    return await this.handleAsyncOperation(async () => {
      const user = await this.userModel
        .findOne({ id: dto.id })
        .select('-password');
      if (!user)
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);
      if (user.roles.includes(RolesEnum.ADMIN))
        return MicroserviceResponseStatusFabric.create(HttpStatus.CONFLICT);
      user.isBlocked = true;
      await user.save();
      await this.tokenModel.deleteMany({ userId: dto.id });
      return this.createUserDto(user);
    });
  }

  async unblockUser(dto: UserIdDto) {
    return await this.handleAsyncOperation(async () => {
      const user = await this.userModel
        .findOne({ id: dto.id })
        .select('-password');
      if (!user)
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);
      user.isBlocked = false;
      await user.save();
      return this.createUserDto(user);
    });
  }

  async updateAdmin(dto: UpdateAdminDto) {
    return await this.handleAsyncOperation(async () => {
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

      return this.createResponse(user, dto.userAgent);
    });
  }

  async createUserByAdmin(data: CreateUserDto) {
    return await this.handleAsyncOperation(async () => {
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

      const response = this.createUserDto(user);
      return response;
    });
  }

  async addAdminRoleToUser(data: AddAdminDto) {
    return await this.handleAsyncOperation(async () => {
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

      return this.createUserDto(user);
    });
  }

  async getStats() {
    return await this.handleAsyncOperation(async () => {
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

  async getUsersFromUserSearchDto(data: UserSearchDto[]) {
    return await this.handleAsyncOperation(async () => {
      const users = await this.userModel
        .find({ id: { $in: data.map((user) => user.id) } })
        .select('-password -_id -__v');

      if (isArray(users) && users.length === 0) return [];

      const usersWithTokenCount = await Promise.all(
        users.map(async (user) => {
          const userObj: UserDto = user.toObject();

          const tokensCount = await this.tokenModel.countDocuments({
            userId: user.id,
          });

          userObj.tokensCount = tokensCount;

          return userObj;
        }),
      );
      return usersWithTokenCount;
    });
  }

  public async reindexSearhchEngine() {
    return await this.handleAsyncOperation(async () => {
      const users = await this.userModel.find().select('-password -_id -__v');

      if (isArray(users) && users.length === 0)
        MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);

      await this.searchService.update(users, MsgSearchEnum.SET_USERS);

      return MicroserviceResponseStatusFabric.create(HttpStatus.NO_CONTENT);
    });
  }
}
