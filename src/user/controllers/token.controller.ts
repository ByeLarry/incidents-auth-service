import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RefreshTokenValueAndUserAgentDto } from '../../libs/dto';
import { MsgAuthEnum } from '../../libs/enums';
import { TokenService } from '../services';

@Controller()
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}
  @MessagePattern(MsgAuthEnum.REFRESH)
  async refresh(@Payload() dto: RefreshTokenValueAndUserAgentDto) {
    return await this.tokenService.refreshTokens(dto.value, dto.userAgent);
  }
}
