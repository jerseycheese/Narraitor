import { Logger } from '../logger';

describe('Logger', () => {
  test('can be created and used without errors', () => {
    const logger = new Logger('TestComponent');
    expect(logger).toBeDefined();
    
    // Ensure all log methods can be called without throwing errors
    expect(() => {
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warning message');
      logger.error('error message');
    }).not.toThrow();
  });

  test('handles different contexts', () => {
    expect(() => {
      const loggerA = new Logger('ComponentA');
      const loggerB = new Logger('ComponentB');
      
      loggerA.info('test from A');
      loggerB.info('test from B');
    }).not.toThrow();
  });

  test('handles multiple arguments', () => {
    const logger = new Logger('Test');
    const data = { key: 'value' };
    
    expect(() => {
      logger.debug('message', data, 123, true);
    }).not.toThrow();
  });
});
