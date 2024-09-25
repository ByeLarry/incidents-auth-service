import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/User.schema';
import { Session, SessionSchema } from '../schemas/Session.schema';
import { MailerModule } from '@nestjs-modules/mailer';
import { SessionAuthController } from './session-auth.controller';
import { SessionAuthService } from './session-auth.service';

@Module({
  imports: [
    MailerModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
  ],
  controllers: [SessionAuthController],
  providers: [SessionAuthService],
})
export class SessionAuthModule {}
