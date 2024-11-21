import { HttpStatus, Injectable } from '@nestjs/common';
import {
  AuthProvidersDto,
  JwtAuthDto,
  UserDto,
  UserRolesDto,
} from '../../libs/dto';
import {
  handleAsyncOperation,
  handleAsyncOperationWithToken,
} from '../../libs/helpers';
import { MicroserviceResponseStatusFabric } from '../../libs/utils';
import { AuthProvidersEnum, MsgSearchEnum } from '../../libs/enums';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../../schemas';
import { SearchService } from '../../libs/services';
import { IJwtPayload } from '../../interfaces';
import { ResponseService } from './response.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly searchService: SearchService,
    private readonly responseService: ResponseService,
  ) {}
  public async jwtAuth(data: JwtAuthDto) {
    return handleAsyncOperation(async () => {
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

  public async userRoles(accessTokenValue: string) {
    return await handleAsyncOperationWithToken(async () => {
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
    return await handleAsyncOperation(async () => {
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

        return this.responseService.createResponse(userExist, data.userAgent);
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

      return this.responseService.createResponse(user, data.userAgent);
    });
  }
}
