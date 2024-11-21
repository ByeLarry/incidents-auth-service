import { Injectable, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ITokens } from '../../interfaces';
import { MicroserviceResponseStatus } from '../../libs/dto';
import { handleAsyncOperation } from '../../libs/helpers';
import {
  NO_USER_AGENT,
  MicroserviceResponseStatusFabric,
} from '../../libs/utils';
import { User, Token } from '../../schemas';
import { add } from 'date-fns';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Token.name) private readonly tokenModel: Model<Token>,
  ) {}

  public async generateTokens(
    user: User,
    agent: string,
  ): Promise<ITokens | MicroserviceResponseStatus> {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.getOrCreateRefreshToken(user, agent);

    if (refreshToken instanceof MicroserviceResponseStatus) {
      return refreshToken;
    }

    return { accessToken, refreshToken };
  }

  public async refreshTokens(
    refreshTokenValue: string,
    agent: string,
  ): Promise<ITokens | MicroserviceResponseStatus> {
    return await handleAsyncOperation(async () => {
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

  private generateAccessToken(user: User): string {
    return (
      'Bearer ' +
      this.jwtService.sign({
        id: user.id,
        email: user.email.trim(),
        roles: user.roles,
      })
    );
  }

  private async getOrCreateRefreshToken(
    user: User,
    agent: string,
  ): Promise<Token | MicroserviceResponseStatus> {
    const userAgent = agent?.trim() || NO_USER_AGENT;

    return await handleAsyncOperation(async () => {
      return await this.tokenModel.findOneAndUpdate(
        { userId: user.id, userAgent },
        {
          userId: user.id,
          value: uuidv4(),
          exp: add(new Date(), { months: 1 }),
          userAgent,
        },
        { new: true, upsert: true },
      );
    });
  }
}
