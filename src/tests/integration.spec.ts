import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user/user.controller';
import { UserService } from '../user/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/User.schema';
import { Session, SessionSchema } from '../schemas/Session.schema';
import { MailerModule } from '@nestjs-modules/mailer';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as mongoose from 'mongoose';
import { SignUpDto } from '../user/dto/signup.dto';
import { SignInDto } from '../user/dto/signin.dto';
import { SessionIdFromCookieDto } from '../user/dto/sessionIdFromCookie.dto';
import { AuthAndLogoutDto } from '../user/dto/authAndLogout.dto';
import { HttpStatusExtends } from '../utils/extendsHttpStatus.enum';
import { UserDto } from '../user/dto/user.dto';
import { ConfigModule } from '@nestjs/config';

describe('UserController Integration Tests', () => {
  let controller: UserController;
  let service: UserService;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        MongooseModule.forRoot(mongoUri),
        MongooseModule.forFeature([
          { name: User.name, schema: UserSchema },
          { name: Session.name, schema: SessionSchema },
        ]),
        MailerModule.forRoot({
          transport: {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          },
          defaults: {
            from: process.env.SMTP_USER,
          },
        }),
      ],
      controllers: [UserController],
      providers: [UserService],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should signup a user', async () => {
    const signupDto: SignUpDto = {
      name: 'John',
      surname: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
    };

    const response = await controller.signup(signupDto);

    expect(response).toHaveProperty('email', 'john.doe@example.com');
    expect(response).toHaveProperty('csrf_token');
    expect(response).toHaveProperty('session_id');
  });

  it('should signin a user', async () => {
    const signinDto: SignInDto = {
      email: 'john.doe@example.com',
      password: 'password123',
    };

    const response = await controller.signin(signinDto);

    expect(response).toHaveProperty('email', 'john.doe@example.com');
    expect(response).toHaveProperty('csrf_token');
    expect(response).toHaveProperty('session_id');
  });

  it('should return user data for me', async () => {
    const signupDto: SignUpDto = {
      name: 'Jane',
      surname: 'Doe',
      email: 'jane.doe@example.com',
      password: 'password123',
    };
    const signupResponse = (await controller.signup(signupDto)) as UserDto;

    const meDto: SessionIdFromCookieDto = {
      session_id_from_cookie: signupResponse.session_id,
    };
    const response = await controller.me(meDto);
    expect(response).toHaveProperty('email', 'jane.doe@example.com');
    expect(response).toHaveProperty('csrf_token', signupResponse.csrf_token);
    expect(response).toHaveProperty('session_id', signupResponse.session_id);
  });

  it('should refresh session', async () => {
    const signupDto: SignUpDto = {
      name: 'Alice',
      surname: 'Smith',
      email: 'alice.smith@example.com',
      password: 'password123',
    };
    const signupResponse = (await controller.signup(signupDto)) as UserDto;

    const refreshDto: SessionIdFromCookieDto = {
      session_id_from_cookie: signupResponse.session_id,
    };
    const response = await controller.refresh(refreshDto);
    expect(response).toHaveProperty('session_id', signupResponse.session_id);
  });

  it('should handle session auth', async () => {
    const signupDto: SignUpDto = {
      name: 'Bob',
      surname: 'Brown',
      email: 'bob.brown@example.com',
      password: 'password123',
    };
    const signupResponse = (await controller.signup(signupDto)) as UserDto;

    const authDto: AuthAndLogoutDto = {
      session_id_from_cookie: signupResponse.session_id,
      csrf_token: signupResponse.csrf_token,
    };
    const response = await controller.auth(authDto);
    expect(response).toBe(HttpStatusExtends.NO_CONTENT);
  });

  it('should handle session logout', async () => {
    const signupDto: SignUpDto = {
      name: 'Eve',
      surname: 'Davis',
      email: 'eve.davis@example.com',
      password: 'password123',
    };
    const signupResponse = (await controller.signup(signupDto)) as UserDto;

    const logoutDto: AuthAndLogoutDto = {
      session_id_from_cookie: signupResponse.session_id,
      csrf_token: signupResponse.csrf_token,
    };
    const response = await controller.logout(logoutDto);
    expect(response).toBe(HttpStatusExtends.NO_CONTENT);
  });
});
