import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../schemas/User.schema';
import { Model } from 'mongoose';
import { v4 } from 'uuid';
import { Session } from '../schemas/Session.schema';
import { MailerService } from '@nestjs-modules/mailer';
import { IMicroserviceResponseStatus } from '../interfaces';
import { MicroserviceResponseStatusFabric } from '../libs/utils';
import { DateEnum, HttpStatusExtends } from '../libs/enums';
import {
  AuthAndLogoutDto,
  SessionIdDto,
  SessionIdFromCookieDto,
  SignInDto,
  SignUpDto,
  UserDto,
} from '../libs/dto';
import { Crypt } from '../libs/helpers';

type AsyncFunction<T> = () => Promise<T>;

@Injectable()
export class SessionAuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Session.name) private sessionModel: Model<Session>,
    private readonly mailService: MailerService,
  ) {}

  private async handleAsyncOperation<T>(
    operation: AsyncFunction<T>,
  ): Promise<T | IMicroserviceResponseStatus> {
    try {
      return await operation();
    } catch (error) {
      const res = MicroserviceResponseStatusFabric.create(
        HttpStatusExtends.INTERNAL_SERVER_ERROR,
        error,
      );
      return res;
    }
  }

  async signin(
    data: SignInDto,
  ): Promise<UserDto | IMicroserviceResponseStatus> {
    return await this.handleAsyncOperation<
      IMicroserviceResponseStatus | UserDto
    >(async () => {
      const user = await this.userModel.findOne({
        email: data.email,
      });
      if (!user) {
        return MicroserviceResponseStatusFabric.create(
          HttpStatusExtends.NOT_FOUND,
        );
      }
      const isMatch = Crypt.verifyPassword(user.password, data.password);
      if (!isMatch) {
        return MicroserviceResponseStatusFabric.create(
          HttpStatusExtends.UNAUTHORIZED,
        );
      }
      const session_id = v4();
      const csrf_token = v4();
      const session = new this.sessionModel({
        session_id: session_id,
        user: user,
        csrf_token: csrf_token,
        expires: new Date(Date.now() + DateEnum.ONE_DAY),
      });
      await session.save();
      const userSendDto: UserDto = {
        name: user.name,
        surname: user.surname,
        email: user.email,
        _id: user._id.toString(),
        activated: user.activated,
        csrf_token: csrf_token,
        session_id: session_id,
      };
      return userSendDto;
    });
  }

  async signup(
    data: SignUpDto,
  ): Promise<UserDto | IMicroserviceResponseStatus> {
    return await this.handleAsyncOperation<
      IMicroserviceResponseStatus | UserDto
    >(async () => {
      {
        const hashedPassword = Crypt.hashPassword(data.password);

        const existingUser = await this.userModel.findOne({
          email: data.email,
        });

        if (existingUser) {
          return MicroserviceResponseStatusFabric.create(
            HttpStatusExtends.CONFLICT,
          );
        }
        const user = new this.userModel({
          name: data.name,
          surname: data.surname,
          email: data.email,
          password: hashedPassword,
        });
        await user.save();
        const session_id = v4();
        const csrf_token = v4();
        const session = new this.sessionModel({
          session_id,
          user,
          csrf_token,
          expires: new Date(Date.now() + DateEnum.ONE_DAY),
        });

        await session.save();
        const userSendDto: UserDto = {
          name: user.name,
          surname: user.surname,
          email: user.email,
          _id: user._id.toString(),
          activated: user.activated,
          csrf_token: csrf_token,
          session_id: session_id,
        };

        // await this.mailService.sendMail({
        //   to: data.email,
        //   subject: 'Добро пожаловать в Incidents',
        //   html: hello(user.name),
        // });

        return userSendDto;
      }
    });
  }

  async me(
    data: SessionIdFromCookieDto,
  ): Promise<IMicroserviceResponseStatus | UserDto> {
    return await this.handleAsyncOperation(async () => {
      const session = await this.sessionModel.findOne({
        session_id: data.session_id_from_cookie,
      });
      if (!session) {
        return MicroserviceResponseStatusFabric.create(
          HttpStatusExtends.UNAUTHORIZED,
        );
      }

      if (session.expires < new Date()) {
        await session.deleteOne();
        return MicroserviceResponseStatusFabric.create(
          HttpStatusExtends.SESSION_EXPIRED,
        );
      }
      const user = await this.userModel.findById(session.user);

      const userSendDto: UserDto = {
        name: user.name,
        surname: user.surname,
        email: user.email,
        _id: user._id.toString(),
        activated: user.activated,
        csrf_token: session.csrf_token,
        session_id: session.session_id,
      };
      return userSendDto;
    });
  }

  async refresh(
    data: SessionIdFromCookieDto,
  ): Promise<IMicroserviceResponseStatus | SessionIdDto> {
    return await this.handleAsyncOperation(async () => {
      const session = await this.sessionModel.findOne({
        session_id: data.session_id_from_cookie,
      });
      if (!session) {
        return MicroserviceResponseStatusFabric.create(
          HttpStatusExtends.UNAUTHORIZED,
        );
      }

      if (session.expires < new Date()) {
        await session.deleteOne();
        return MicroserviceResponseStatusFabric.create(
          HttpStatusExtends.SESSION_EXPIRED,
        );
      }
      session.expires = new Date(Date.now() + DateEnum.ONE_DAY);
      await session.save();
      const refreshSendDto: SessionIdDto = {
        session_id: data.session_id_from_cookie,
      };
      return refreshSendDto;
    });
  }

  async auth(data: AuthAndLogoutDto): Promise<IMicroserviceResponseStatus> {
    return await this.handleAsyncOperation<IMicroserviceResponseStatus>(
      async () => {
        const session = await this.sessionModel.findOne({
          session_id: data.session_id_from_cookie,
        });
        if (!session) {
          return MicroserviceResponseStatusFabric.create(
            HttpStatusExtends.UNAUTHORIZED,
          );
        }

        if (session.expires < new Date()) {
          await session.deleteOne();
          return MicroserviceResponseStatusFabric.create(
            HttpStatusExtends.SESSION_EXPIRED,
          );
        }

        if (session.csrf_token !== data.csrf_token) {
          return MicroserviceResponseStatusFabric.create(
            HttpStatusExtends.FORBIDDEN,
          );
        }

        return MicroserviceResponseStatusFabric.create(
          HttpStatusExtends.NO_CONTENT,
        );
      },
    );
  }

  async logout(data: AuthAndLogoutDto): Promise<IMicroserviceResponseStatus> {
    return await this.handleAsyncOperation<IMicroserviceResponseStatus>(
      async () => {
        const session = await this.sessionModel.findOne({
          session_id: data.session_id_from_cookie,
        });
        if (!session) {
          return MicroserviceResponseStatusFabric.create(
            HttpStatusExtends.UNAUTHORIZED,
          );
        }

        if (session.expires < new Date()) {
          await session.deleteOne();
          return MicroserviceResponseStatusFabric.create(
            HttpStatusExtends.SESSION_EXPIRED,
          );
        }

        if (session.csrf_token !== data.csrf_token) {
          return MicroserviceResponseStatusFabric.create(
            HttpStatusExtends.FORBIDDEN,
          );
        }
        await session.deleteOne();
        return MicroserviceResponseStatusFabric.create(
          HttpStatusExtends.NO_CONTENT,
        );
      },
    );
  }
}
