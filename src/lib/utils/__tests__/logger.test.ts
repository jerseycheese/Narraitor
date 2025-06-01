import { Logger } from '../logger';

describe('Logger', () => {
  let consoleDebugSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('Logger creation and configuration', () => {
    test('creates logger with default context', () => {
      const logger = new Logger('TestComponent');
      expect(logger).toBeDefined();
    });

    test('creates logger with custom context', () => {
      process.env.NEXT_PUBLIC_DEBUG_LOGGING = 'true';
      const logger = new Logger('CustomContext');
      logger.debug('test message');
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('[CustomContext]'),
        expect.any(String),
        'test message'
      );
    });
  });

  describe('Severity level logging', () => {
    test('logs debug messages', () => {
      process.env.NEXT_PUBLIC_DEBUG_LOGGING = 'true';
      const logger = new Logger('Test');
      logger.debug('debug message');
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test]'),
        expect.any(String),
        'debug message'
      );
    });

    test('logs info messages', () => {
      process.env.NEXT_PUBLIC_DEBUG_LOGGING = 'true';
      const logger = new Logger('Test');
      logger.info('info message');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test]'),
        expect.any(String),
        'info message'
      );
    });

    test('logs warn messages', () => {
      process.env.NEXT_PUBLIC_DEBUG_LOGGING = 'true';
      const logger = new Logger('Test');
      logger.warn('warning message');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test]'),
        expect.any(String),
        'warning message'
      );
    });

    test('logs error messages', () => {
      process.env.NEXT_PUBLIC_DEBUG_LOGGING = 'true';
      const logger = new Logger('Test');
      logger.error('error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test]'),
        expect.any(String),
        'error message'
      );
    });
  });

  describe('Environment-based toggling', () => {
    test('logs when debug logging is enabled', () => {
      process.env.NEXT_PUBLIC_DEBUG_LOGGING = 'true';
      const logger = new Logger('Test');
      logger.debug('test message');
      expect(consoleDebugSpy).toHaveBeenCalled();
    });

    test('does not log when debug logging is disabled', () => {
      process.env.NEXT_PUBLIC_DEBUG_LOGGING = 'false';
      const logger = new Logger('Test');
      logger.debug('test message');
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });
  });


  describe('Context tracking', () => {
    test('includes context in log messages', () => {
      process.env.NEXT_PUBLIC_DEBUG_LOGGING = 'true';
      const logger = new Logger('MyComponent');
      logger.info('test message');
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MyComponent]'),
        expect.any(String),
        'test message'
      );
    });

    test('handles multiple arguments in log messages', () => {
      process.env.NEXT_PUBLIC_DEBUG_LOGGING = 'true';
      const logger = new Logger('Test');
      const data = { key: 'value' };
      logger.debug('message', data, 123);
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'message',
        data,
        123
      );
    });
  });


});