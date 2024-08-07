import { Injectable } from '@nestjs/common';
import { SignInDto } from './dto/signin.dto';
import { SignUpDto } from './dto/signup.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/schemas/User.schema';
import { Model } from 'mongoose';
import { v4 } from 'uuid';
import { Session } from 'src/schemas/Session.schema';
import { UserSendDto } from './dto/user-send.dto';
import { SessionIdRecvDto } from './dto/session-id-recv.dto';
import { LogoutRecvDto } from './dto/logout-recv.dto';
import { RefreshRecvDto } from './dto/refresh-recv.dto';
import { RefreshSendDto } from './dto/refresh-send.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { AuthSendDto } from './dto/auth-send.dto';
import { Crypt } from 'src/utils/crypt';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Session.name) private sessionModel: Model<Session>,
    private readonly mailService: MailerService,
  ) {}

  async signin(data: SignInDto) {
    try {
      const user = await this.userModel.findOne({
        email: data.email,
      });
      if (!user) {
        return '404';
      }
      const isMatch = Crypt.verifyPassword(user.password, data.password);
      if (!isMatch) {
        return '401';
      }
      const session_id = v4();
      const csrf_token = v4();
      const session = new this.sessionModel({
        session_id: session_id,
        user: user,
        csrf_token: csrf_token,
        expires: new Date(Date.now() + 60 * 60 * 1000 * 24),
      });
      await session.save();
      const userSendDto: UserSendDto = {
        name: user.name,
        surname: user.surname,
        email: user.email,
        _id: user._id.toString(),
        activated: user.activated,
        csrf_token: csrf_token,
        session_id: session_id,
      };
      return userSendDto;
    } catch (error) {
      console.log(error);
      return '500';
    }
  }

  async signup(data: SignUpDto) {
    try {
      const hashedPassword = Crypt.hashPassword(data.password);

      const existingUser = await this.userModel.findOne({
        email: data.email,
      });

      if (existingUser) {
        return '409';
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
        expires: new Date(Date.now() + 60 * 60 * 1000 * 24),
      });

      await session.save();
      const userSendDto: UserSendDto = {
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
    } catch (error) {
      return '500';
    }
  }

  async me(data: SessionIdRecvDto) {
    try {
      const session = await this.sessionModel.findOne({
        session_id: data.session_id_from_cookie,
      });
      if (!session) {
        return '401';
      }

      if (session.expires < new Date()) {
        await session.deleteOne();
        return '419';
      }
      const user = await this.userModel.findById(session.user);

      if (!user) {
        session.deleteOne();
        return '404';
      }
      const userSendDto: UserSendDto = {
        name: user.name,
        surname: user.surname,
        email: user.email,
        _id: user._id.toString(),
        activated: user.activated,
        csrf_token: session.csrf_token,
        session_id: session.session_id,
      };
      return userSendDto;
    } catch (error) {
      return '500';
    }
  }

  async refresh(data: RefreshRecvDto) {
    try {
      const session = await this.sessionModel.findOne({
        session_id: data.session_id_from_cookie,
      });
      if (!session) {
        return '401';
      }

      if (session.expires < new Date()) {
        await session.deleteOne();
        return '419';
      }

      const user = await this.userModel.findById(session.user);

      if (!user) {
        session.deleteOne();
        return '404';
      }
      session.expires = new Date(Date.now() + 60 * 60 * 1000 * 24);
      await session.save();
      const refreshSendDto: RefreshSendDto = {
        session_id: data.session_id_from_cookie,
      };
      return refreshSendDto;
    } catch (error) {
      return '500';
    }
  }

  async auth(data: AuthSendDto) {
    try {
      const session = await this.sessionModel.findOne({
        session_id: data.session_id_from_cookie,
      });
      if (!session) {
        return '401';
      }

      if (session.expires < new Date()) {
        await session.deleteOne();
        return '419';
      }

      if (session.csrf_token !== data.csrf_token) {
        return '403';
      }

      const user = await this.userModel.findById(session.user);

      if (!user) {
        session.deleteOne();
        return '404';
      }

      return '200';
    } catch (error) {
      return '500';
    }
  }

  async logout(data: LogoutRecvDto) {
    try {
      const session = await this.sessionModel.findOne({
        session_id: data.session_id_from_cookie,
      });
      if (!session) {
        return '404';
      }

      if (session.expires < new Date()) {
        await session.deleteOne();
        return '419';
      }

      if (session.csrf_token !== data.csrf_token) {
        return '403';
      }
      const user = await this.userModel.findById(session.user);

      if (!user) {
        session.deleteOne();
        return '404';
      }
      await session.deleteOne();
      return '200';
    } catch (error) {
      return '500';
    }
  }
}
