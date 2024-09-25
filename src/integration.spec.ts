import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MailerModule } from '@nestjs-modules/mailer';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as mongoose from 'mongoose';
import { ConfigModule } from '@nestjs/config';
import { SessionAuthService } from './session-auth/session-auth.service';
import { SessionAuthController } from './session-auth/session-auth.controller';
import { User, UserSchema } from './schemas/User.schema';
import { Session, SessionSchema } from './schemas/Session.schema';
import { SignInDto } from './libs/dto/signin.dto';
import { SignUpDto } from './libs/dto/signup.dto';
import { SessionIdFromCookieDto } from './libs/dto/session-id-from-cookie.dto';
import { UserDto } from './libs/dto/user.dto';
import { HttpStatusExtends } from './libs/enums/extends-http-status.enum';
import { MicroserviceResponseStatusFabric } from './libs/utils/microservice-response-status-fabric.util';
import { AuthAndLogoutDto } from './libs/dto/auth-and-logout.dto';

describe('UserController Integration Tests', () => {
  let controller: SessionAuthController;
  let service: SessionAuthService;
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
      controllers: [SessionAuthController],
      providers: [SessionAuthService],
    }).compile();

    controller = module.get<SessionAuthController>(SessionAuthController);
    service = module.get<SessionAuthService>(SessionAuthService);
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
    expect(response).toEqual(
      MicroserviceResponseStatusFabric.create(HttpStatusExtends.NO_CONTENT),
    );
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
    expect(response).toEqual(
      MicroserviceResponseStatusFabric.create(HttpStatusExtends.NO_CONTENT),
    );
  });
});
