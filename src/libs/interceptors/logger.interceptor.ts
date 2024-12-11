import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AppLoggerService } from '../helpers/logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new AppLoggerService();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const calledHandler = context.getHandler().name;
    return next.handle().pipe(
      tap((data) => {
        this.logger.log(
          `[${calledHandler}] -${" " + data.status || ""} returned data length:  ${JSON.stringify(data)?.length || 0}`,
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
