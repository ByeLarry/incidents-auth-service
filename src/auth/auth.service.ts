import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { add } from 'date-fns';
import { v4 } from 'uuid';
import { IJwtPayload, ITokens } from '../interfaces';
import { Token, User } from '../schemas';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { MicroserviceResponseStatusFabric, NO_USER_AGENT } from '../libs/utils';
import {
  AdminLoginDto,
  AuthProvidersDto,
  DeleteUserDto,
  JwtAuthDto,
  MicroserviceResponseStatus,
  RefreshTokenValueAndUserAgentDto,
  SignInDto,
  SignUpDto,
  UserDto,
  UserRolesDto,
} from '../libs/dto';
import { UserAndTokensDto } from '../libs/dto/user-and-tokens.dto';
import { genSaltSync, hashSync } from 'bcrypt';
import { AuthProvidersEnum, RolesEnum } from '../libs/enums';

type AsyncFunction<T> = () => Promise<T>;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Token.name) private tokenModel: Model<Token>,
  ) {}

  private async handleAsyncOperation<T>(
    operation: AsyncFunction<T>,
  ): Promise<T | MicroserviceResponseStatus> {
    try {
      return await operation();
    } catch (error) {
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

  public async signup(data: SignUpDto) {
    return await this.handleAsyncOperation(async () => {
      const hashedPassword = hashSync(data.password, genSaltSync(10));

      const existingUser = await this.userModel.findOne({
        email: data.email,
      });
      if (existingUser) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.CONFLICT);
      }
      const user = new this.userModel({
        name: data.name,
        surname: data.surname,
        email: data.email,
        password: hashedPassword,
      });
      await user.save();
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
      const userSendDto: UserDto = {
        name: user.name,
        surname: user.surname,
        email: user.email,
        id: user.id,
        activated: user.activated,
        roles: user.roles,
        provider: user.provider,
      };
      return userSendDto;
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
        name: user.name,
        surname: user.surname,
        email: user.email,
        id: user.id,
        activated: user.activated,
        roles: user.roles,
        provider: user.provider,
      };
      return response;
    });
  }

  public async deleteUser(dto: DeleteUserDto) {
    return await this.handleAsyncOperationWithToken(async () => {
      const user = await this.userModel.findOne({ id: dto.userId });
      if (!user) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);
      }
      const payload = this.jwtService.verify<IJwtPayload>(dto.accessTokenValue);
      if (payload.id !== dto.userId && !user.roles.includes(RolesEnum.ADMIN)) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.FORBIDDEN);
      }

      await this.tokenModel.deleteMany({ userId: user.id });
      await user.deleteOne();
      return MicroserviceResponseStatusFabric.create(HttpStatus.NO_CONTENT);
    });
  }

  public async userRoles(accessTokenValue: string) {
    return await this.handleAsyncOperationWithToken(async () => {
      const payload = this.jwtService.verify<IJwtPayload>(accessTokenValue);
      const user = await this.userModel.findOne({ id: payload.id });
      if (!user) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);
      }
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
        if (
          userExist.provider === AuthProvidersEnum.LOCAL ||
          userExist.provider !== provider
        ) {
          return MicroserviceResponseStatusFabric.create(HttpStatus.CONFLICT);
        }
        return this.createResponse(userExist, data.userAgent);
      }
      const user = await this.userModel.create({
        name: data.name,
        surname: data.surname,
        email: data.email,
        provider,
      });
      if (!user)
        return MicroserviceResponseStatusFabric.create(HttpStatus.BAD_REQUEST);
      return this.createResponse(user, data.userAgent);
    });
  }

  async adminLogin(data: AdminLoginDto) {
    return await this.handleAsyncOperation(async () => {
      const user = await this.userModel.findOne({
        name: data.name,
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
        email: user.email,
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
          userId: user.id,
          value: v4(),
          exp: add(new Date(), { months: 1 }),
          userAgent: agent || NO_USER_AGENT,
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
    const userSendDto: UserDto = {
      name: user.name,
      surname: user.surname,
      email: user.email,
      id: user.id,
      activated: user.activated,
      roles: user.roles,
      provider: user.provider,
    };
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
}
