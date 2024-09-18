import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user/user.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserSchema } from '../schemas/User.schema';
import { Session, SessionSchema } from '../schemas/Session.schema';
import { MailerService } from '@nestjs-modules/mailer';
import { Crypt } from '../utils/crypt';
import { SignInDto } from '../user/dto/signin.dto';
import { SignUpDto } from '../user/dto/signup.dto';
import { HttpStatusExtends } from '../utils/extendsHttpStatus.enum';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as mongoose from 'mongoose';
import { DateEnum } from '../utils/date.enum';
import { v4 } from 'uuid';

describe('UserService (integration)', () => {
  let service: UserService;
  let userModel: Model<User>;
  let sessionModel: Model<Session>;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: mongoose.model(User.name, UserSchema),
        },
        {
          provide: getModelToken(Session.name),
          useValue: mongoose.model(Session.name, SessionSchema),
        },
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
    sessionModel = module.get<Model<Session>>(getModelToken(Session.name));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
    await sessionModel.deleteMany({});
  });

  describe('signin', () => {
    it('should return user DTO on successful sign in', async () => {
      const signInDto: SignInDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const hashedPassword = Crypt.hashPassword('password123');

      const user = new userModel({
        name: 'John',
        surname: 'Doe',
        email: 'test@example.com',
        password: hashedPassword,
        activated: true,
      });
      await user.save();

      const result = await service.signin(signInDto);

      expect(result).toHaveProperty('name', 'John');
      expect(result).toHaveProperty('surname', 'Doe');
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).toHaveProperty('activated', true);
      expect(result).toHaveProperty('csrf_token');
      expect(result).toHaveProperty('session_id');
    });

    it('should return NOT_FOUND if user does not exist', async () => {
      const signInDto: SignInDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const result = await service.signin(signInDto);

      expect(result).toBe(HttpStatusExtends.NOT_FOUND);
    });

    it('should return UNAUTHORIZED if password is incorrect', async () => {
      const signInDto: SignInDto = {
        email: 'test@example.com',
        password: 'wrongPassword',
      };
      const hashedPassword = Crypt.hashPassword('password123');

      const user = new userModel({
        name: 'John',
        surname: 'Doe',
        email: 'test@example.com',
        password: hashedPassword,
        activated: true,
      });
      await user.save();

      const result = await service.signin(signInDto);

      expect(result).toBe(HttpStatusExtends.UNAUTHORIZED);
    });
  });

  describe('signup', () => {
    it('should return user DTO on successful signup', async () => {
      const signUpDto: SignUpDto = {
        name: 'Jane',
        surname: 'Doe',
        email: 'jane@example.com',
        password: 'password123',
      };

      const result = await service.signup(signUpDto);

      expect(result).toHaveProperty('name', 'Jane');
      expect(result).toHaveProperty('surname', 'Doe');
      expect(result).toHaveProperty('email', 'jane@example.com');
      expect(result).toHaveProperty('csrf_token');
      expect(result).toHaveProperty('session_id');
    });

    it('should return CONFLICT if email is already in use', async () => {
      const signUpDto: SignUpDto = {
        name: 'Jane',
        surname: 'Doe',
        email: 'jane@example.com',
        password: 'password123',
      };

      const user = new userModel(signUpDto);
      await user.save();

      const result = await service.signup(signUpDto);

      expect(result).toBe(HttpStatusExtends.CONFLICT);
    });
  });

  describe('me', () => {
    it('should return FORBIDDEN if user does not exist', async () => {
      const session_id = v4();
      jest.spyOn(sessionModel, 'findOne').mockResolvedValue({
        session_id,
        user: 'non-existent-user-id',
        expires: new Date(Date.now() + 10000),
        csrf_token: 'csrf-token',
      });
      jest.spyOn(userModel, 'findById').mockResolvedValue(null);
      jest.restoreAllMocks();
      const result = await service.me({ session_id_from_cookie: session_id });
      expect(result).toBe(HttpStatusExtends.UNAUTHORIZED);
    });

    it('should return user DTO on successful request', async () => {
      const signUpDto: SignUpDto = {
        name: 'Jane',
        surname: 'Doe',
        email: 'jane@example.com',
        password: 'password123',
      };
      const user = new userModel(signUpDto);
      await user.save();

      const session_id = v4();
      const csrf_token = v4();
      const session = new sessionModel({
        session_id,
        user,
        csrf_token,
        expires: new Date(Date.now() + DateEnum.ONE_DAY),
      });
      await session.save();

      const result = await service.me({ session_id_from_cookie: session_id });

      expect(result).toHaveProperty('name', 'Jane');
      expect(result).toHaveProperty('surname', 'Doe');
      expect(result).toHaveProperty('email', 'jane@example.com');
      expect(result).toHaveProperty('csrf_token', csrf_token);
      expect(result).toHaveProperty('session_id', session_id);
    });

    it('should return UNAUTHORIZED if session does not exist', async () => {
      const result = await service.me({
        session_id_from_cookie: 'invalid-session-id',
      });
      expect(result).toBe(HttpStatusExtends.UNAUTHORIZED);
    });

    it('should return SESSION_EXPIRED if session has expired', async () => {
      const signUpDto: SignUpDto = {
        name: 'Jane',
        surname: 'Doe',
        email: 'jane@example.com',
        password: 'password123',
      };
      const user = new userModel(signUpDto);
      await user.save();

      const session_id = v4();
      const csrf_token = v4();
      const session = new sessionModel({
        session_id,
        user,
        csrf_token,
        expires: new Date(Date.now() - DateEnum.ONE_DAY), // Expired session
      });
      await session.save();

      const result = await service.me({ session_id_from_cookie: session_id });

      expect(result).toBe(HttpStatusExtends.SESSION_EXPIRED);
    });
  });

  describe('refresh', () => {
    it('should return session ID on successful refresh', async () => {
      const signUpDto: SignUpDto = {
        name: 'Jane',
        surname: 'Doe',
        email: 'jane@example.com',
        password: 'password123',
      };
      const user = new userModel(signUpDto);
      await user.save();

      const session_id = v4();
      const csrf_token = v4();
      const session = new sessionModel({
        session_id,
        user,
        csrf_token,
        expires: new Date(Date.now() + DateEnum.ONE_DAY),
      });
      await session.save();

      const result = await service.refresh({
        session_id_from_cookie: session_id,
      });

      expect(result).toHaveProperty('session_id', session_id);
    });

    it('should return UNAUTHORIZED if session does not exist', async () => {
      const result = await service.refresh({
        session_id_from_cookie: 'invalid-session-id',
      });
      expect(result).toBe(HttpStatusExtends.UNAUTHORIZED);
    });

    it('should return SESSION_EXPIRED if session has expired', async () => {
      const signUpDto: SignUpDto = {
        name: 'Jane',
        surname: 'Doe',
        email: 'jane@example.com',
        password: 'password123',
      };
      const user = new userModel(signUpDto);
      await user.save();

      const session_id = v4();
      const csrf_token = v4();
      const session = new sessionModel({
        session_id,
        user,
        csrf_token,
        expires: new Date(Date.now() - DateEnum.ONE_DAY), // Expired session
      });
      await session.save();

      const result = await service.refresh({
        session_id_from_cookie: session_id,
      });

      expect(result).toBe(HttpStatusExtends.SESSION_EXPIRED);
    });
  });

  describe('auth', () => {
    it('should return SESSION_EXPIRED if session has expired', async () => {
      const signUpDto: SignUpDto = {
        name: 'Jane',
        surname: 'Doe',
        email: 'jane@example.com',
        password: 'password123',
      };
      const user = new userModel(signUpDto);
      const session_id = v4();
      const csrf_token = v4();
      const session = new sessionModel({
        session_id,
        user,
        csrf_token,
        expires: new Date(Date.now() - DateEnum.ONE_DAY), // Expired session
      });
      await session.save();

      const result = await service.auth({
        session_id_from_cookie: session_id,
        csrf_token,
      });

      expect(result).toBe(HttpStatusExtends.SESSION_EXPIRED);
    });
    it('should return NO_CONTENT on successful authorization', async () => {
      const signUpDto: SignUpDto = {
        name: 'Jane',
        surname: 'Doe',
        email: 'jane@example.com',
        password: 'password123',
      };
      const user = new userModel(signUpDto);
      await user.save();
      const session_id = v4();
      const csrf_token = v4();
      const session = new sessionModel({
        session_id,
        user,
        csrf_token,
        expires: new Date(Date.now() + DateEnum.ONE_DAY),
      });
      await session.save();

      const result = await service.auth({
        session_id_from_cookie: session_id,
        csrf_token,
      });

      expect(result).toBe(HttpStatusExtends.NO_CONTENT);
    });

    it('should return UNAUTHORIZED if session does not exist', async () => {
      const result = await service.auth({
        session_id_from_cookie: 'invalid-session-id',
        csrf_token: 'invalid-csrf-token',
      });
      expect(result).toBe(HttpStatusExtends.UNAUTHORIZED);
    });

    it('should return FORBIDDEN if CSRF token is incorrect', async () => {
      const signUpDto: SignUpDto = {
        name: 'Jane',
        surname: 'Doe',
        email: 'jane@example.com',
        password: 'password123',
      };
      const user = new userModel(signUpDto);
      await user.save();

      const session_id = v4();
      const csrf_token = v4();
      const session = new sessionModel({
        session_id,
        user,
        csrf_token,
        expires: new Date(Date.now() + DateEnum.ONE_DAY),
      });
      await session.save();

      const result = await service.auth({
        session_id_from_cookie: session_id,
        csrf_token: 'wrong-csrf-token',
      });

      expect(result).toBe(HttpStatusExtends.FORBIDDEN);
    });
  });

  describe('logout', () => {
    it('should return SESSION_EXPIRED if session has expired', async () => {
      const signUpDto: SignUpDto = {
        name: 'Jane',
        surname: 'Doe',
        email: 'jane@example.com',
        password: 'password123',
      };
      const user = new userModel(signUpDto);
      const session_id = v4();
      const csrf_token = v4();
      const session = new sessionModel({
        session_id,
        user,
        csrf_token,
        expires: new Date(Date.now() - DateEnum.ONE_DAY), // Expired session
      });
      await session.save();

      const result = await service.logout({
        session_id_from_cookie: session_id,
        csrf_token,
      });

      expect(result).toBe(HttpStatusExtends.SESSION_EXPIRED);
    });

    it('should return NO_CONTENT on successful logout', async () => {
      const signUpDto: SignUpDto = {
        name: 'Jane',
        surname: 'Doe',
        email: 'jane@example.com',
        password: 'password123',
      };
      const user = new userModel(signUpDto);
      await user.save();
      const session_id = v4();
      const csrf_token = v4();
      const session = new sessionModel({
        session_id,
        user,
        csrf_token,
        expires: new Date(Date.now() + DateEnum.ONE_DAY),
      });
      await session.save();

      const result = await service.logout({
        session_id_from_cookie: session_id,
        csrf_token,
      });

      expect(result).toBe(HttpStatusExtends.NO_CONTENT);
      const deletedSession = await sessionModel.findOne({ session_id });
      expect(deletedSession).toBeNull();
    });

    it('should return NOT_FOUND if session does not exist', async () => {
      const result = await service.logout({
        session_id_from_cookie: 'invalid-session-id',
        csrf_token: 'invalid-csrf-token',
      });
      expect(result).toBe(HttpStatusExtends.NOT_FOUND);
    });

    it('should return FORBIDDEN if CSRF token is incorrect', async () => {
      const signUpDto: SignUpDto = {
        name: 'Jane',
        surname: 'Doe',
        email: 'jane@example.com',
        password: 'password123',
      };
      const user = new userModel(signUpDto);
      await user.save();

      const session_id = v4();
      const csrf_token = v4();
      const session = new sessionModel({
        session_id,
        user,
        csrf_token,
        expires: new Date(Date.now() + DateEnum.ONE_DAY),
      });
      await session.save();

      const result = await service.logout({
        session_id_from_cookie: session_id,
        csrf_token: 'wrong-csrf-token',
      });

      expect(result).toBe(HttpStatusExtends.FORBIDDEN);
    });

    it('should return INTERNAL_SERVER_ERROR ', async () => {
      jest
        .spyOn(sessionModel, 'findOne')
        .mockRejectedValue(new Error('Database error'));
      const result = await service.logout({
        session_id_from_cookie: 'invalid-session-id',
        csrf_token: 'invalid-csrf-token',
      });
      expect(result).toBe(HttpStatusExtends.INTERNAL_SERVER_ERROR);
    });
  });
});
