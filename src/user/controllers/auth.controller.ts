import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AccessTokenDto, AuthProvidersDto, JwtAuthDto } from '../../libs/dto';
import { MsgAuthEnum, AuthProvidersEnum } from '../../libs/enums';
import { AuthService } from '../services';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @MessagePattern(MsgAuthEnum.JWT_AUTH)
  async jwtAuth(@Payload() dto: JwtAuthDto) {
    return await this.authService.jwtAuth(dto);
  }
}
