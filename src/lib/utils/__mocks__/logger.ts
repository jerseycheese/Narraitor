// src/lib/utils/__mocks__/logger.ts

const mockLoggerMethods = {
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  log: jest.fn()
};

export const logger = mockLoggerMethods;

export class Logger {
  constructor(/* _name?: string */) {
    Object.assign(this, mockLoggerMethods);
  }
  
  debug = mockLoggerMethods.debug;
  error = mockLoggerMethods.error;
  warn = mockLoggerMethods.warn;
  info = mockLoggerMethods.info;
  log = mockLoggerMethods.log;
}

// Mock the default export as a constructor function that returns an instance with the mock methods
class MockLogger {
  constructor(/* _context?: string */) {
    // Copy all mock methods to this instance
    Object.assign(this, mockLoggerMethods);
  }
  
  debug = mockLoggerMethods.debug;
  error = mockLoggerMethods.error;
  warn = mockLoggerMethods.warn;
  info = mockLoggerMethods.info;
  log = mockLoggerMethods.log;
}

export default MockLogger;