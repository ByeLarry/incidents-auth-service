import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { DEFAULT_RMQ_TIMEOUT, SEARCH_SERVICE_TAG } from '../utils';
import { AppLoggerService } from '../helpers';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { MsgSearchEnum } from '../enums';

@Injectable()
export class SearchService {
  constructor(
    @Inject(SEARCH_SERVICE_TAG) private readonly client: ClientProxy,
    private readonly logger: AppLoggerService,
  ) {}

  async search<T, U>(data: T, index: MsgSearchEnum): Promise<U> {
    return await this.update<T, U>(data, index);
  }

  async update<T, U>(data: T, index: MsgSearchEnum): Promise<U> {
    try {
      const res = await firstValueFrom<U>(
        this.client.send(index, data).pipe(
          timeout(DEFAULT_RMQ_TIMEOUT),
          catchError((err) => {
            if (err.name === 'TimeoutError') {
              throw new Error(
                `Request timed out after ${DEFAULT_RMQ_TIMEOUT / 1000} seconds`,
              );
            }
            throw err;
          }),
        ),
      );

      this.logger.log(`[${index}] - ${res}`);

      return res;
    } catch (error) {
      this.catchError(error);
    }
  }

  private async catchError(error: any): Promise<string> {
    return Promise.resolve(error.message);
  }
}
