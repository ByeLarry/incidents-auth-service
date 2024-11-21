import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IJwtPayload } from '../../interfaces';
import { Token, User } from '../../schemas';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  MicroserviceResponseStatusFabric,
  NO_USER_AGENT,
} from '../../libs/utils';
import {
  DeleteUserDto,
  PaginationDto,
  RefreshTokenValueAndUserAgentDto,
  SignInDto,
  SignUpDto,
  UserDto,
  UserIdDto,
  UsersViaPaginationDto,
} from '../../libs/dto';
import { compare, genSaltSync, hashSync } from 'bcrypt';
import { AuthProvidersEnum, MsgSearchEnum, RolesEnum } from '../../libs/enums';
import { SearchService } from '../../libs/services';
import {
  handleAsyncOperation,
  handleAsyncOperationWithToken,
} from '../../libs/helpers';
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

  public async signup(data: SignUpDto) {
    return await handleAsyncOperation(async () => {
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

      const response = await this.responseService.createResponse(
        user,
        data.userAgent,
      );
      return response;
    });
  }

  public async signin(data: SignInDto) {
    return await handleAsyncOperation(async () => {
      const user = await this.userModel.findOne({ email: data.email });
      if (!user) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);
      }
      if (user.provider !== AuthProvidersEnum.LOCAL) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.CONFLICT);
      }
      const isMatch = await compare(data.password, user.password);
      if (!isMatch) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);
      }
      const response = await this.responseService.createResponse(
        user,
        data.userAgent,
      );
      return response;
    });
  }

  public async me(data: RefreshTokenValueAndUserAgentDto) {
    return await handleAsyncOperation(async () => {
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

      return this.responseService.createUserDto(user);
    });
  }

  public async logout(refreshTokenValue: string) {
    return await handleAsyncOperation(async () => {
      const token = await this.tokenModel.findOne({ value: refreshTokenValue });
      if (!token) {
        return MicroserviceResponseStatusFabric.create(HttpStatus.UNAUTHORIZED);
      }
      await token.deleteOne();
      return MicroserviceResponseStatusFabric.create(HttpStatus.NO_CONTENT);
    });
  }

  public async deleteUser(dto: DeleteUserDto) {
    return await handleAsyncOperationWithToken(async () => {
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

      const result = this.responseService.createUserDto(user);
      return result;
    });
  }

  async getAllUsers(dto: PaginationDto) {
    return await handleAsyncOperation(async () => {
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
    return await handleAsyncOperation(async () => {
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
      return this.responseService.createUserDto(user);
    });
  }

  async unblockUser(dto: UserIdDto) {
    return await handleAsyncOperation(async () => {
      const user = await this.userModel
        .findOne({ id: dto.id })
        .select('-password');
      if (!user)
        return MicroserviceResponseStatusFabric.create(HttpStatus.NOT_FOUND);
      user.isBlocked = false;
      await user.save();
      return this.responseService.createUserDto(user);
    });
  }
}
