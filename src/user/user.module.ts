import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { options, SearchServiceProvide } from '../libs/utils';
import { MongooseModule } from '@nestjs/mongoose';
import { Token, TokenSchema, User, UserSchema } from '../schemas';
import { AppLoggerService } from '../libs/helpers';
import { SearchService } from '../libs/services';
import { UserController } from './controllers/user.controller';
import {
  UserService,
  TokenService,
  AuthService,
  ResponseService,
  AdminService,
} from './services';
import { UsersSearchService } from './services/users-search.service';
import { UserSearchController } from './controllers/user-search.controller';
import {
  AdminController,
  AuthController,
  TokenController,
} from './controllers';

@Module({
  controllers: [
    UserController,
    UserSearchController,
    TokenController,
    AdminController,
    AuthController,
  ],
  providers: [
    UserService,
    SearchServiceProvide,
    AppLoggerService,
    SearchService,
    TokenService,
    AuthService,
    ResponseService,
    AdminService,
    UsersSearchService,
  ],
  imports: [
    JwtModule.registerAsync(options()),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Token.name, schema: TokenSchema },
    ]),
  ],
})
export class UserModule {}
