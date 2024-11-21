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
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly searchService: SearchService,
    private readonly responseService: ResponseService,
  ) {}

  public async jwtAuth(data: JwtAuthDto) {
    return handleAsyncOperation(async () => {
      const user = await this.findUser(data);

      if (!user)
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);
      if (user.isBlocked)
        return MicroserviceResponseStatusFabric.create(HttpStatus.FORBIDDEN);

      return this.buildUserDto(user);
    });
  }

  public async userRoles(accessTokenValue: string) {
    return handleAsyncOperationWithToken(async () => {
      const payload = this.jwtService.verify<IJwtPayload>(accessTokenValue);
      const user = await this.userModel.findOne({ id: payload.id });

      if (!user)
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);

      return { roles: user.roles } as UserRolesDto;
    });
  }

  public async authByProviders(
    data: AuthProvidersDto,
    provider: AuthProvidersEnum,
  ) {
    return handleAsyncOperation(async () => {
      const existingUser = await this.userModel.findOne({ email: data.email });

      if (existingUser) {
        return this.handleExistingProviderUser(
          existingUser,
          provider,
          data.userAgent,
        );
      }

      const newUser = await this.createProviderUser(data, provider);
      if (!newUser)
        return MicroserviceResponseStatusFabric.create(HttpStatus.BAD_REQUEST);

      await this.searchService.update(newUser, MsgSearchEnum.SET_USER);
      return this.responseService.createResponse(newUser, data.userAgent);
    });
  }

  private async findUser(data: JwtAuthDto) {
    return this.userModel.findOne({
      email: data.email,
      id: data.id,
      roles: data.roles,
    });
  }

  private buildUserDto(user: User): UserDto {
    return {
      name: user.name.trim(),
      surname: user.surname.trim(),
      email: user.email.trim(),
      id: user.id.trim(),
      activated: user.activated,
      roles: user.roles,
      provider: user.provider,
    };
  }

  private handleExistingProviderUser(
    user: User,
    provider: AuthProvidersEnum,
    userAgent: string,
  ) {
    if (user.isBlocked)
      return MicroserviceResponseStatusFabric.create(
        HttpStatus.FORBIDDEN,
        'User is blocked',
      );

    if (user.provider === AuthProvidersEnum.LOCAL || user.provider !== provider)
      return MicroserviceResponseStatusFabric.create(HttpStatus.CONFLICT);

    return this.responseService.createResponse(user, userAgent);
  }

  private async createProviderUser(
    data: AuthProvidersDto,
    provider: AuthProvidersEnum,
  ) {
    return this.userModel.create({
      name: data.name.trim(),
      surname: data.surname.trim(),
      email: data.email.trim(),
      provider,
    });
  }
}
