import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLoggerService } from 'src/utils/logger';

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
    );
  }
}
