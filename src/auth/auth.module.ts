import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { options, SearchServiceProvide } from '../libs/utils';
import { MongooseModule } from '@nestjs/mongoose';
import { Token, TokenSchema, User, UserSchema } from '../schemas';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AppLoggerService } from '../libs/helpers';
import { SearchService } from '../libs/services';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    SearchServiceProvide,
    AppLoggerService,
    SearchService,
  ],
  imports: [
    JwtModule.registerAsync(options()),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Token.name, schema: TokenSchema },
    ]),
  ],
})
export class AuthModule {}
