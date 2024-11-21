import { Injectable, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 } from 'uuid';
import { ITokens } from '../../interfaces';
import { MicroserviceResponseStatus } from '../../libs/dto';
import {  handleAsyncOperation } from '../../libs/helpers';
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
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Token.name) private tokenModel: Model<Token>,
  ) {}

  public async generateTokens(
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
    return await handleAsyncOperation(async () => {
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

  public async refreshTokens(refreshTokenValue: string, agent: string) {
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
}
