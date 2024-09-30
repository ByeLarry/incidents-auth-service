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
  MicroserviceResponseStatus,
  RefreshTokenValueAndUserAgentDto,
  SignInDto,
  SignUpDto,
  UserDto,
} from '../libs/dto';
import { UserAndTokensDto } from '../libs/dto/user-and-tokens.dto';
import { genSaltSync, hashSync } from 'bcrypt';

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
      const res = MicroserviceResponseStatusFabric.create(
        HttpStatus.INTERNAL_SERVER_ERROR,
        error,
      );
      return res;
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
      const userSendDto: UserDto = {
        name: user.name,
        surname: user.surname,
        email: user.email,
        _id: user._id.toString(),
        activated: user.activated,
        roles: user.roles,
        provider: user.provider,
      };
      const tokens = await this.generateTokens(user, data.userAgent);
      if (tokens instanceof MicroserviceResponseStatus) {
        return tokens;
      }
      const response: UserAndTokensDto = {
        user: userSendDto,
        tokens,
      };
      await user.save();
      return response;
    });
  }

  public async signin(data: SignInDto) {
    return await this.handleAsyncOperation(async () => {
      const user = await this.userModel.findOne({ email: data.email });
      if (!user) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);
      }
      const isMatch = hashSync(data.password, genSaltSync(10));
      if (!isMatch) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.UNAUTHORIZED);
      }
      const userSendDto: UserDto = {
        name: user.name,
        surname: user.surname,
        email: user.email,
        _id: user._id.toString(),
        activated: user.activated,
        roles: user.roles,
        provider: user.provider,
      };
      const tokens = await this.generateTokens(user, data.userAgent);
      if (tokens instanceof MicroserviceResponseStatus) {
        return tokens;
      }
      const response: UserAndTokensDto = {
        user: userSendDto,
        tokens,
      };
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
        return MicroserviceResponseStatusFabric.create(HttpStatus.UNAUTHORIZED);
      }
      const userSendDto: UserDto = {
        name: user.name,
        surname: user.surname,
        email: user.email,
        _id: user._id.toString(),
        activated: user.activated,
        roles: user.roles,
        provider: user.provider,
      };
      return userSendDto;
    });
  }

  async refreshTokens(
    refreshTokenValue: string,
    agent: string,
  ): Promise<ITokens | MicroserviceResponseStatus> {
    return await this.handleAsyncOperation(async () => {
      const token = await this.tokenModel.findOne({ value: refreshTokenValue });
      if (!token || new Date(token.exp) < new Date()) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.UNAUTHORIZED);
      }

      await token.deleteOne();
      const user = await this.userModel.findOne({ id: token.userId });

      if (!user) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.UNAUTHORIZED);
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

  public async auth(
    accessTokenValue: string,
  ): Promise<MicroserviceResponseStatus> {
    try {
      const payload = this.jwtService.verify<IJwtPayload>(accessTokenValue);
      const user = await this.userModel.findOne({ id: payload.id });
      if (!user) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);
      }
      return MicroserviceResponseStatusFabric.create(HttpStatus.NO_CONTENT);
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
      const _token = await this.tokenModel.findOne({
        user,
        userAgent: agent || NO_USER_AGENT,
      });
      const tokenValue = _token?.value ?? null;
      const token = await this.tokenModel.findOneAndUpdate(
        { value: tokenValue },
        {
          userId: user.id,
          value: v4(),
          exp: add(new Date(), { months: 1 }),
          userAgent: agent || NO_USER_AGENT,
        },
        { new: true, upsert: true },
      );
      token.save();
      return token;
    });
  }
}
