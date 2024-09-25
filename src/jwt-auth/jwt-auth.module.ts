import { Module } from '@nestjs/common';
import { JwtAuthService } from './jwt-auth.service';
import { JwtAuthController } from './jwt-auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/User.schema';
import { Token, TokenSchema } from '../schemas/Token.schema';
import { options } from '../lib/utils';

/**
 * @deprecated
 */

@Module({
  controllers: [JwtAuthController],
  providers: [JwtAuthService],
  imports: [
    PassportModule,
    JwtModule.registerAsync(options()),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Token.name, schema: TokenSchema },
    ]),
  ],
})
export class JwtAuthModule {}
