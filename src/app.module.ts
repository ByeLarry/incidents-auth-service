import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { SessionAuthModule } from './session-auth/session-auth.module';
import { mailerOptionsFactory } from './lib/utils';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(`${process.env.MONGO_CONNECTION_STRING}`),
    SessionAuthModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: mailerOptionsFactory,
    }),
  ],
})
export class AppModule {}
