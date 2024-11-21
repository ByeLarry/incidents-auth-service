import { HttpStatus } from '@nestjs/common';
import { MicroserviceResponseStatus } from '../dto';
import { MicroserviceResponseStatusFabric } from '../utils';

type AsyncFunction<T> = () => Promise<T>;

export async function handleAsyncOperation<T>(
  operation: AsyncFunction<T>,
): Promise<T | MicroserviceResponseStatus> {
  try {
    return await operation();
  } catch (error) {
    return MicroserviceResponseStatusFabric.create(
      HttpStatus.INTERNAL_SERVER_ERROR,
      error,
    );
  }
}

export async function handleAsyncOperationWithToken<T>(
  operation: AsyncFunction<T>,
): Promise<T | MicroserviceResponseStatus> {
  try {
    return await operation();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return MicroserviceResponseStatusFabric.create(HttpStatus.UNAUTHORIZED);
    }
    if (error.name === 'TokenExpiredError') {
      return MicroserviceResponseStatusFabric.create(HttpStatus.UNAUTHORIZED);
    }
    return MicroserviceResponseStatusFabric.create(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
