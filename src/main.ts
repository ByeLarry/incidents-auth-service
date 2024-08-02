import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { LoggingInterceptor } from './interceptors/logger.interceptor';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: `${process.env.HOST}`,
        port: Number(process.env.PORT),
      },
    },
  );
  app.useGlobalInterceptors(new LoggingInterceptor());
  await app.listen();
}
bootstrap();
