import { Observable, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { HttpStatusExtends } from '../enums';

export function handleTimeoutAndErrors<T = unknown>() {
  return (source$: Observable<T>) =>
    source$.pipe(
      timeout(5000),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          throw new Error(HttpStatusExtends.REQUEST_TIMEOUT.toString());
        }
        throw new Error(HttpStatusExtends.BAD_REQUEST.toString());
      }),
    );
}
