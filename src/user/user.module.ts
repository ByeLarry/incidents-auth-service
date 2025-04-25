import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { mailerOptionsFactory, options, SearchServiceProvide } from '../libs/utils';
import { MongooseModule } from '@nestjs/mongoose';
import { Token, TokenSchema, User, UserSchema } from '../schemas';
import { AppLoggerService } from '../libs/helpers';
import { SearchService, EmailService } from '../libs/services';
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
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';

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
    EmailService,
  ],
  imports: [
    JwtModule.registerAsync(options()),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Token.name, schema: TokenSchema },
    ]),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: mailerOptionsFactory,
    }),
  ],
})
export class UserModule {}
