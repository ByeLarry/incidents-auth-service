import { Test, TestingModule } from '@nestjs/testing';
import { AppLoggerService } from './logger';
import { createLogger, Logger } from 'winston';

jest.mock('winston', () => ({
  createLogger: jest.fn(),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    printf: jest.fn(),
  },
  transports: {
    DailyRotateFile: jest.fn(),
  },
}));

describe('AppLoggerService', () => {
  let service: AppLoggerService;
  let mockLogger: Logger;

  beforeEach(async () => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as unknown as Logger;

    (createLogger as jest.Mock).mockReturnValue(mockLogger);

    const module: TestingModule = await Test.createTestingModule({
      providers: [AppLoggerService],
    }).compile();

    service = module.get<AppLoggerService>(AppLoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call logger.log with info level when log is called', () => {
    const message = 'Test log message';
    service.log(message);
    expect(mockLogger.log).toHaveBeenCalledWith('info', message);
  });

  it('should call logger.error with error level when error is called', () => {
    const message = 'Test error message';
    const trace = 'Test trace';
    service.error(message, trace);
    expect(mockLogger.error).toHaveBeenCalledWith(message, { trace });
  });

  it('should call logger.warn with warn level when warn is called', () => {
    const message = 'Test warn message';
    service.warn(message);
    expect(mockLogger.warn).toHaveBeenCalledWith(message);
  });

  it('should call logger.debug with debug level when debug is called', () => {
    const message = 'Test debug message';
    service.debug(message);
    expect(mockLogger.debug).toHaveBeenCalledWith(message);
  });
});
