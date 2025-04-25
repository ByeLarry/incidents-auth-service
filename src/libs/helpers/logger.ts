import { Injectable, Logger } from '@nestjs/common';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

@Injectable()
export class AppLoggerService {
  private readonly logger: winston.Logger;
  private readonly nestLogger = new Logger();

  constructor() {
    this.logger = winston.createLogger({
      transports: [
        new DailyRotateFile({
          filename: 'logs/auth-service-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '7d',
          level: 'info',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message, context }) => {
              const date = new Date(timestamp);
              const formattedDate = date
                .toISOString()
                .slice(0, 19)
                .replace('T', ' ');
              const levelMap = {
                info: 'LOG',
                error: 'ERROR',
                warn: 'WARN',
                debug: 'DEBUG',
              };
              const nestLevel = levelMap[level].padEnd(5);
              const contextStr = context ? ` [${context}]` : '';
              return `[${formattedDate}] ${nestLevel}${contextStr} ${message}`;
            }),
          ),
        }),
      ],
    });
  }

  log(message: string | undefined, context?: string) {
    if (message === undefined) return;
    if (!context) this.nestLogger.log(message)
    else this.nestLogger.log(message, context)
    this.logger.info({ message, context });
  }

  error(message: string | undefined, trace?: string, context?: string) {
    if (message === undefined) return;
    const errorMessage = trace ? `${message} - ${trace}` : message;
    if (!context) this.nestLogger.error(errorMessage);
    else this.nestLogger.error(errorMessage, null, context);
    this.logger.error({ message: errorMessage, context });
  }

  warn(message: string | undefined, context?: string) {
    if (message === undefined) return;
    if (!context) this.nestLogger.warn(message);
    else this.nestLogger.warn(message, context);
    this.logger.warn({ message, context });
  }

  debug(message: string | undefined, context?: string) {
    if (message === undefined) return;
    if (!context) this.nestLogger.debug(message);
    else this.nestLogger.debug(message, context);
    this.logger.debug({ message, context });
  }
}
