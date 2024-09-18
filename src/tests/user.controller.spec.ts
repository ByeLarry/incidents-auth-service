import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user/user.controller';
import { UserService } from '../user/user.service';
import { SignUpDto } from '../user/dto/signup.dto';
import { SignInDto } from '../user/dto/signin.dto';
import { UserDto } from '../user/dto/user.dto';
import { HttpStatusExtends } from '../utils/extendsHttpStatus.enum';
import { SessionIdFromCookieDto } from '../user/dto/sessionIdFromCookie.dto';
import { SessionIdDto } from '../user/dto/sessioinId.dto';
import { AuthAndLogoutDto } from '../user/dto/authAndLogout.dto';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            signup: jest.fn(),
            signin: jest.fn(),
            me: jest.fn(),
            refresh: jest.fn(),
            logout: jest.fn(),
            auth: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should call userService.signup with correct data', async () => {
      const dto: SignUpDto = {
        email: 'test@test.test',
        password: 'testtest',
        name: 'test',
        surname: 'test',
      };
      const result: UserDto | HttpStatusExtends = {
        email: 'test@test.test',
        name: 'test',
        surname: 'test',
        activated: false,
        _id: 'test',
        csrf_token: 'test',
        session_id: 'test',
      };
      jest.spyOn(service, 'signup').mockResolvedValue(result);

      expect(await controller.signup(dto)).toBe(result);
      expect(service.signup).toHaveBeenCalledWith(dto);
    });
  });

  describe('signin', () => {
    it('should call userService.signin with correct data', async () => {
      const dto: SignInDto = {
        email: 'test@test.test',
        password: 'testtest',
      };
      const result: UserDto | HttpStatusExtends = {
        email: 'test@test.test',
        name: 'test',
        surname: 'test',
        activated: false,
        _id: 'test',
        csrf_token: 'test',
        session_id: 'test',
      };
      jest.spyOn(service, 'signin').mockResolvedValue(result);

      expect(await controller.signin(dto)).toBe(result);
      expect(service.signin).toHaveBeenCalledWith(dto);
    });
  });

  describe('me', () => {
    it('should call userService.me with correct data', async () => {
      const dto: SessionIdFromCookieDto = {
        session_id_from_cookie: 'test',
      };
      const result: UserDto | HttpStatusExtends = {
        email: 'test@test.test',
        name: 'test',
        surname: 'test',
        activated: false,
        _id: 'test',
        csrf_token: 'test',
        session_id: 'test',
      };
      jest.spyOn(service, 'me').mockResolvedValue(result);

      expect(await controller.me(dto)).toBe(result);
      expect(service.me).toHaveBeenCalledWith(dto);
    });
  });

  describe('refresh', () => {
    it('should call userService.refresh with correct data', async () => {
      const dto: SessionIdFromCookieDto = {
        session_id_from_cookie: 'test',
      };
      const result: HttpStatusExtends | SessionIdDto = {
        session_id: 'test',
      };
      jest.spyOn(service, 'refresh').mockResolvedValue(result);

      expect(await controller.refresh(dto)).toBe(result);
      expect(service.refresh).toHaveBeenCalledWith(dto);
    });
  });

  describe('logout', () => {
    it('should call userService.logout with correct data', async () => {
      const dto: AuthAndLogoutDto = {
        session_id_from_cookie: 'test',
        csrf_token: 'test',
      };
      const result: HttpStatusExtends = HttpStatusExtends.NO_CONTENT;
      jest.spyOn(service, 'logout').mockResolvedValue(result);

      expect(await controller.logout(dto)).toBe(result);
      expect(service.logout).toHaveBeenCalledWith(dto);
    });
  });

  describe('auth', () => {
    it('should call userService.auth with correct data', async () => {
      const dto: AuthAndLogoutDto = {
        session_id_from_cookie: 'test',
        csrf_token: 'test',
      };
      const result = HttpStatusExtends.NO_CONTENT;
      jest.spyOn(service, 'auth').mockResolvedValue(result);

      expect(await controller.auth(dto)).toBe(result);
      expect(service.auth).toHaveBeenCalledWith(dto);
    });
  });
});
