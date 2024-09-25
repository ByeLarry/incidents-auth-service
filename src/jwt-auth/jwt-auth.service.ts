import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../schemas/User.schema';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { Token } from '../schemas/Token.schema';
import { v4 } from 'uuid';
import { add } from 'date-fns';
import { IMicroserviceResponseStatus } from '../interfaces';
import {
  RefreshTokenDto,
  SignInDto,
  SignUpDto,
  TokensDto,
  UserDto,
} from '../lib/dto';
import { MicroserviceResponseStatusFabric } from '../lib/utils';
import { HttpStatusExtends } from '../lib/enums';
import { Crypt } from '../lib/helpers';

type AsyncFunction<T> = () => Promise<T>;

/**
 * @deprecated
 */
@Injectable()
export class JwtAuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Token.name) private tokenModel: Model<Token>,
    private readonly jwtService: JwtService,
  ) {}
  private async handleAsyncOperation<T>(
    operation: AsyncFunction<T>,
  ): Promise<T | IMicroserviceResponseStatus> {
    try {
      return await operation();
    } catch (error) {
      const res = MicroserviceResponseStatusFabric.create(
        HttpStatusExtends.INTERNAL_SERVER_ERROR,
        error,
      );
      return res;
    }
  }

  private async getRefreshToken(userId: User): Promise<RefreshTokenDto> {
    const newRefreshToken: Token = {
      token: v4(),
      exp: add(new Date(), { months: 1 }),
      userId,
    };
    await this.tokenModel.create(newRefreshToken);
    return {
      token: newRefreshToken.token,
      exp: newRefreshToken.exp,
      userId: newRefreshToken.userId.toString(),
    };
  }

  private async generateToken(user: User, userId: string): Promise<TokensDto> {
    const accessToken =
      'Bearer ' +
      this.jwtService.sign({
        _id: userId,
        email: user.email,
      });
    const refreshToken = await this.getRefreshToken(user);
    return { accessToken, refreshToken };
  }

  async login(data: SignInDto): Promise<UserDto | IMicroserviceResponseStatus> {
    return await this.handleAsyncOperation<
      IMicroserviceResponseStatus | UserDto
    >(async () => {
      const user = await this.userModel.findOne({
        email: data.email,
      });
      if (!user) {
        return MicroserviceResponseStatusFabric.create(
          HttpStatusExtends.NOT_FOUND,
        );
      }
      const isMatch = Crypt.verifyPassword(user.password, data.password);
      if (!isMatch) {
        return MicroserviceResponseStatusFabric.create(
          HttpStatusExtends.UNAUTHORIZED,
        );
      }
      const userSendDto: UserDto = {
        name: user.name,
        surname: user.surname,
        email: user.email,
        _id: user._id.toString(),
        activated: user.activated,
      };
      const tokens = await this.generateToken(user, user._id.toString());
      const response: UserDto = {
        ...userSendDto,
        tokens,
      };
      return response;
    });
  }

  async register(
    data: SignUpDto,
  ): Promise<UserDto | IMicroserviceResponseStatus> {
    return await this.handleAsyncOperation<
      IMicroserviceResponseStatus | UserDto
    >(async () => {
      {
        const hashedPassword = Crypt.hashPassword(data.password);

        const existingUser = await this.userModel.findOne({
          email: data.email,
        });

        if (existingUser) {
          return MicroserviceResponseStatusFabric.create(
            HttpStatusExtends.CONFLICT,
          );
        }
        const user = new this.userModel({
          name: data.name,
          surname: data.surname,
          email: data.email,
          password: hashedPassword,
        });
        await user.save();
        const userSendDto: UserDto = {
          name: user.name,
          surname: user.surname,
          email: user.email,
          _id: user._id.toString(),
          activated: user.activated,
        };
        const tokens = await this.generateToken(user, user._id.toString());
        const response: UserDto = {
          ...userSendDto,
          tokens,
        };
        return response;
      }
    });
  }

  async refreshTokens(
    data: string,
  ): Promise<TokensDto | IMicroserviceResponseStatus> {
    const token = await this.tokenModel.findOne({ token: data });
    if (!token) {
      return MicroserviceResponseStatusFabric.create(
        HttpStatusExtends.UNAUTHORIZED,
      );
    }
    await token.deleteOne();
    const user = await this.userModel.findOne(token.userId);
    return this.generateToken(user, user._id.toString());
  }
}
