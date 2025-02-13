import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { LoggingInterceptor } from './libs/interceptors/logger.interceptor';
import { AUTH_RMQ_QUEUE } from './libs/utils';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const httpApp = await NestFactory.create(AppModule);
  const configService = httpApp.get(ConfigService);
  const port = configService.get<number>('PORT');

  await httpApp.listen(port);

  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [configService.get<string>('RMQ_HOST')],
        queue: AUTH_RMQ_QUEUE,
        queueOptions: {
          durable: false,
        },
      },
    },
  );

  microservice.useGlobalPipes(new ValidationPipe());
  microservice.useGlobalInterceptors(new LoggingInterceptor());
  await microservice.listen();
}
bootstrap();
