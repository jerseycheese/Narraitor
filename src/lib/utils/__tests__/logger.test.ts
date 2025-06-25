import { Logger } from '../logger';

describe('Logger', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.spyOn(console, 'debug').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
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
      expect(console.debug).toHaveBeenCalledWith(
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
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('[Test]'),
        expect.any(String),
        'debug message'
      );
    });

    test('logs info messages', () => {
      process.env.NEXT_PUBLIC_DEBUG_LOGGING = 'true';
      const logger = new Logger('Test');
      logger.info('info message');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[Test]'),
        expect.any(String),
        'info message'
      );
    });

    test('logs warn messages', () => {
      process.env.NEXT_PUBLIC_DEBUG_LOGGING = 'true';
      const logger = new Logger('Test');
      logger.warn('warning message');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[Test]'),
        expect.any(String),
        'warning message'
      );
    });

    test('logs error messages', () => {
      process.env.NEXT_PUBLIC_DEBUG_LOGGING = 'true';
      const logger = new Logger('Test');
      logger.error('error message');
      expect(console.error).toHaveBeenCalledWith(
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
      expect(console.debug).toHaveBeenCalled();
    });

    test('does not log when debug logging is disabled', () => {
      process.env.NEXT_PUBLIC_DEBUG_LOGGING = 'false';
      const logger = new Logger('Test');
      logger.debug('test message');
      expect(console.debug).not.toHaveBeenCalled();
    });
  });


  describe('Context tracking', () => {
    test('includes context in log messages', () => {
      process.env.NEXT_PUBLIC_DEBUG_LOGGING = 'true';
      const logger = new Logger('MyComponent');
      logger.info('test message');
      
      expect(console.log).toHaveBeenCalledWith(
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
      
      expect(console.debug).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'message',
        data,
        123
      );
    });
  });


});
