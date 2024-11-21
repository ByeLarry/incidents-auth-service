
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { throwError } from 'rxjs';
import { AppLoggerService } from '../helpers/logger';
import { LoggingInterceptor } from './logger.interceptor';

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
