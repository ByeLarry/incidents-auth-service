import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { STRTAGIES } from './strategies';
import { UserModule } from '../user/user.module';
import { options } from '../libs/utils';
import { AuthService } from './auth.service';

@Module({
  providers: [AuthService, ...STRTAGIES],
  imports: [PassportModule, JwtModule.registerAsync(options()), UserModule],
})
export class AuthModule {}
