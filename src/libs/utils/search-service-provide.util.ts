import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { SEARCH_RMQ_QUEUE, SEARCH_RMQ_QUEUE_REPLY } from './consts.util';

export const SEARCH_SERVICE_TAG = 'SEARCH_SERVICE';

export const SearchServiceProvide = {
  provide: SEARCH_SERVICE_TAG,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) =>
    ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [`${configService.get('RMQ_HOST')}`],
        queue: SEARCH_RMQ_QUEUE,
        replyQueue: SEARCH_RMQ_QUEUE_REPLY,
        queueOptions: {
          durable: false,
        },
      },
    }),
};
