import { HttpException, HttpStatus } from '@nestjs/common';
import { Observable, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { TIMEOUT_ERROR_DELAY } from '../utils';

export function handleTimeoutAndErrors<T = unknown>() {
  return (source$: Observable<T>) =>
    source$.pipe(
      timeout(TIMEOUT_ERROR_DELAY),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          throw new HttpException(err.message, HttpStatus.REQUEST_TIMEOUT);
        }
        throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
      }),
    );
}
