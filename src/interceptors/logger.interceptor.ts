import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AppLoggerService } from '../utils/logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new AppLoggerService();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const calledHandler = context.getHandler().name;
    return next.handle().pipe(
      tap((data) => {
        this.logger.log(
          `[${calledHandler}] - returned '${JSON.stringify(data).slice(0, 50)}'`,
        );
      }),
      catchError((error) => {
        this.logger.error(
          `[${calledHandler}] - error '${error.message}'`,
          error,
        );
        return throwError(() => error);
      }),
    );
  }
}
