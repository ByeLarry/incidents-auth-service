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

  private async catchError(error: any): Promise<string> {
    return Promise.resolve(error.message);
  }

  async update<T>(data: T, index: MsgSearchEnum): Promise<string> {
    try {
      const res = await firstValueFrom<string>(
        this.client.send(index, data).pipe(
          timeout(DEFAULT_RMQ_TIMEOUT),
          catchError((err) => {
            if (err.name === 'TimeoutError') {
              throw new Error('Request timed out after 5 seconds');
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
}
