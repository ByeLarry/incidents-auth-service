import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compareSync } from 'bcrypt';
import { add } from 'date-fns';
import { v4 } from 'uuid';
import { UserService } from '../user/user.service';
import { IMicroserviceResponseStatus, ITokens } from '../interfaces';
import { Token, User } from '../schemas';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { SignInDto, SignUpDto } from '../libs/dto';
import { AuthProvidersEnum, HttpStatusExtends } from '../libs/enums';
import { MicroserviceResponseStatusFabric } from '../libs/utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Token.name) private tokenModel: Model<Token>,
  ) {}

  async refreshTokens(
    refreshTokenValue: string,
    agent: string,
  ): Promise<ITokens | IMicroserviceResponseStatus> {
    const token = await this.tokenModel.findOne({ value: refreshTokenValue });
    if (!token || new Date(token.exp) < new Date()) {
      return MicroserviceResponseStatusFabric.create(
        HttpStatusExtends.UNAUTHORIZED,
      );
    }

    await token.deleteOne();
    const user = await this.userService.findUserByObjectId(token.user);

    if (!user) {
      return MicroserviceResponseStatusFabric.create(
        HttpStatusExtends.UNAUTHORIZED,
      );
    }

    return this.generateTokens(user, agent);
  }

  async register(dto: SignUpDto): Promise<IMicroserviceResponseStatus> {
    const existingUser: User = await this.userService.findOne(dto.email);
    if (existingUser) {
      return MicroserviceResponseStatusFabric.create(
        HttpStatusExtends.CONFLICT,
      );
    }

    return this.userService.save(dto).catch((err) => {
      console.error(err);
      return null;
    });
  }

  async login(
    dto: SignInDto,
    agent: string,
  ): Promise<ITokens | IMicroserviceResponseStatus> {
    const user: User = await this.userService.findOne(dto.email);
    if (!user || !compareSync(dto.password, user.password)) {
      return MicroserviceResponseStatusFabric.create(
        HttpStatusExtends.UNAUTHORIZED,
      );
    }

    return this.generateTokens(user, agent);
  }

  private async generateTokens(user: User, agent: string): Promise<ITokens> {
    const accessToken =
      'Bearer ' +
      this.jwtService.sign({
        id: user.id,
        email: user.email,
        roles: user.roles,
      });
    const refreshToken = await this.getRefreshToken(user.id, agent);
    return { accessToken, refreshToken };
  }

  private async getRefreshToken(userId: string, agent: string): Promise<Token> {
    const _token = await this.tokenModel.findOne({
      user: userId,
      userAgent: agent,
    });

    const tokenValue = _token?.value ?? null;

    return this.tokenModel.findOneAndUpdate(
      { value: tokenValue },
      {
        value: v4(),
        exp: add(new Date(), { months: 1 }),
      },
      { new: true, upsert: true },
    );
  }

  deleteRefreshToken(value: string) {
    return this.tokenModel.findOneAndDelete({ value });
  }

  async providerAuth(
    email: string,
    agent: string,
    provider: AuthProvidersEnum,
  ) {
    const userExists = await this.userService.findOne(email);
    let user: User;

    if (userExists) {
      user = userExists;
    } else {
      user = await this.userService.save({ email, provider });
      if (!user) {
        return MicroserviceResponseStatusFabric.create(
          HttpStatusExtends.BAD_REQUEST,
        );
      }
    }

    return this.generateTokens(user, agent);
  }
}
