import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { LoggingInterceptor } from './libs/interceptors/logger.interceptor';
import { AUTH_RMQ_QUEUE } from './libs/utils';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [`${process.env.RMQ_HOST}`],
        queue: AUTH_RMQ_QUEUE,
        queueOptions: {
          durable: false,
        },
      },
    },
  );
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new LoggingInterceptor());
  await app.listen();
}
bootstrap();
