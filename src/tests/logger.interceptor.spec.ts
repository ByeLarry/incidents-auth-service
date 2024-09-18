import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AppLoggerService } from '../utils/logger';
import { LoggingInterceptor } from '../interceptors/logger.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let logger: AppLoggerService;

  beforeEach(() => {
    logger = {
      log: jest.fn(),
      error: jest.fn(),
    } as unknown as AppLoggerService;
    interceptor = new LoggingInterceptor();
    (interceptor as any).logger = logger;
  });

  it('should log the returned data', (done) => {
    const context = {
      getHandler: () => ({ name: 'testHandler' }),
    } as unknown as ExecutionContext;

    const callHandler = {
      handle: () => of('test data'),
    } as unknown as CallHandler;

    interceptor.intercept(context, callHandler).subscribe({
      next: () => {
        expect(logger.log).toHaveBeenCalledWith(
          '[testHandler] - returned \'"test data"\'',
        );
        done();
      },
      error: done.fail,
    });
  });

  it('should handle errors and still log', (done) => {
    const context = {
      getHandler: () => ({ name: 'testHandler' }),
    } as unknown as ExecutionContext;

    const callHandler = {
      handle: () => throwError(() => new Error('test error')),
    } as unknown as CallHandler;

    interceptor.intercept(context, callHandler).subscribe({
      error: (err) => {
        expect(err.message).toBe('test error');
        expect(logger.error).toHaveBeenCalledWith(
          "[testHandler] - error 'test error'",
          err,
        );
        done();
      },
    });
  });
});
