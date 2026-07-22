import Logger from '../logger';

describe('Logger', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalLogLevel = process.env.NEXT_PUBLIC_LOG_LEVEL;
  const setNodeEnv = (value: string | undefined): void => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value,
      configurable: true,
      writable: true,
    });
  };

  beforeEach(() => {
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    setNodeEnv(originalNodeEnv);
    if (originalLogLevel === undefined) {
      delete process.env.NEXT_PUBLIC_LOG_LEVEL;
    } else {
      process.env.NEXT_PUBLIC_LOG_LEVEL = originalLogLevel;
    }
    jest.restoreAllMocks();
  });

  it('honors DEBUG as the production log level', () => {
    setNodeEnv('production');
    process.env.NEXT_PUBLIC_LOG_LEVEL = 'DEBUG';

    new Logger('LoggerTest').debug('debug message');

    expect(console.debug).toHaveBeenCalled();
  });

  it('defaults production logging to errors only', () => {
    setNodeEnv('production');
    delete process.env.NEXT_PUBLIC_LOG_LEVEL;

    const logger = new Logger('LoggerTest');
    logger.warn('warn message');
    logger.error('error message');

    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});
