import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { options, SearchServiceProvide } from '../libs/utils';
import { MongooseModule } from '@nestjs/mongoose';
import { Token, TokenSchema, User, UserSchema } from '../schemas';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SearchServiceProvide],
  imports: [
    JwtModule.registerAsync(options()),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Token.name, schema: TokenSchema },
    ]),
  ],
})
export class AuthModule {}
