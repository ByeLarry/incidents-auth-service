import { Controller, HttpStatus } from '@nestjs/common';
import {
  AccessTokenDto,
  AddAdminDto,
  AdminLoginDto,
  AuthProvidersDto,
  CreateUserDto,
  DeleteUserDto,
  JwtAuthDto,
  PaginationDto,
  RefreshTokenValueAndUserAgentDto,
  SearchDto,
  SignInDto,
  SignUpDto,
  UpdateAdminDto,
  UserIdDto,
  UserSearchDto,
} from '../libs/dto';
import { MicroserviceResponseStatusFabric } from '../libs/utils';
import { AuthProvidersEnum, MsgAuthEnum, MsgSearchEnum } from '../libs/enums';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { SearchService } from '../libs/services';

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly searchService: SearchService,
  ) {}

  @MessagePattern(MsgAuthEnum.SIGNUP)
  async signup(@Payload() dto: SignUpDto) {
    const user = await this.authService.signup(dto);
    if (!user) {
      return MicroserviceResponseStatusFabric.create(HttpStatus.BAD_REQUEST);
    }
    return user;
  }

  @MessagePattern(MsgAuthEnum.SIGNIN)
  async signin(@Payload() dto: SignInDto) {
    const user = await this.authService.signin(dto);
    if (!user) {
      return MicroserviceResponseStatusFabric.create(HttpStatus.BAD_REQUEST);
    }
    return user;
  }

  @MessagePattern(MsgAuthEnum.ME)
  async me(@Payload() dto: RefreshTokenValueAndUserAgentDto) {
    const user = await this.authService.me(dto);
    if (!user) {
      return MicroserviceResponseStatusFabric.create(HttpStatus.BAD_REQUEST);
    }
    return user;
  }

  @MessagePattern(MsgAuthEnum.REFRESH)
  async refresh(@Payload() dto: RefreshTokenValueAndUserAgentDto) {
    return await this.authService.refreshTokens(dto.value, dto.userAgent);
  }

  @MessagePattern(MsgAuthEnum.LOGOUT)
  async logout(@Payload() dto: RefreshTokenValueAndUserAgentDto) {
    return await this.authService.logout(dto.value);
  }

  @MessagePattern(MsgAuthEnum.JWT_AUTH)
  async jwtAuth(@Payload() dto: JwtAuthDto) {
    return await this.authService.jwtAuth(dto);
  }

  @MessagePattern(MsgAuthEnum.DELETE)
  async deleteUser(@Payload() dto: DeleteUserDto) {
    return await this.authService.deleteUser(dto);
  }

  @MessagePattern(MsgAuthEnum.USER_ROLES)
  async userRoles(@Payload() dto: AccessTokenDto) {
    return await this.authService.userRoles(dto.value);
  }

  @MessagePattern(MsgAuthEnum.GOOGLE_AUTH)
  async googleAuth(@Payload() dto: AuthProvidersDto) {
    return await this.authService.authByProviders(
      dto,
      AuthProvidersEnum.GOOGLE,
    );
  }

  @MessagePattern(MsgAuthEnum.YANDEX_AUTH)
  async yandexAuth(@Payload() dto: AuthProvidersDto) {
    return await this.authService.authByProviders(
      dto,
      AuthProvidersEnum.YANDEX,
    );
  }

  @MessagePattern(MsgAuthEnum.ADMIN_LOGIN)
  async adminLogin(@Payload() dto: AdminLoginDto) {
    return await this.authService.adminLogin(dto);
  }

  @MessagePattern(MsgAuthEnum.GET_ALL_USERS)
  async getAllUsers(@Payload() dto: PaginationDto) {
    return await this.authService.getAllUsers(dto);
  }

  @MessagePattern(MsgAuthEnum.BLOCK_USER)
  async blockUser(@Payload() dto: UserIdDto) {
    return await this.authService.blockUser(dto);
  }

  @MessagePattern(MsgAuthEnum.UNBLOCK_USER)
  async unblockUser(@Payload() dto: UserIdDto) {
    return await this.authService.unblockUser(dto);
  }

  @MessagePattern(MsgAuthEnum.UPDATE_ADMIN)
  async updateAdmin(@Payload() dto: UpdateAdminDto) {
    return await this.authService.updateAdmin(dto);
  }

  @MessagePattern(MsgAuthEnum.CREATE_USER_BY_ADMIN)
  async createUserByAdmin(@Payload() dto: CreateUserDto) {
    return await this.authService.createUserByAdmin(dto);
  }

  @MessagePattern(MsgAuthEnum.ADD_ADMIN_ROLE_TO_USER)
  async addAdminRoleToUser(@Payload() dto: AddAdminDto) {
    return await this.authService.addAdminRoleToUser(dto);
  }

  @MessagePattern(MsgAuthEnum.USERS_STATS)
  async getStats() {
    return await this.authService.getStats();
  }

  @MessagePattern(MsgAuthEnum.SEARCH_USERS)
  async searchUsers(@Payload() dto: SearchDto) {
    const ids: UserSearchDto[] = await this.searchService.search<
      SearchDto,
      UserSearchDto[]
    >(dto, MsgSearchEnum.SEARCH_USERS);
    return this.authService.getUsersFromUserSearchDto(ids);
  }

  @MessagePattern(MsgAuthEnum.REINDEX)
  async reindexSearhchEngine() {
    return this.authService.reindexSearhchEngine();
  }
}
