import { shouldExposeStoreOnWindow } from '../shouldExposeStoreOnWindow';
import { isPlaywrightEnv } from '../isPlaywrightEnv';

jest.mock('../isPlaywrightEnv', () => ({ isPlaywrightEnv: jest.fn() }));

const mockIsPlaywrightEnv = isPlaywrightEnv as jest.Mock;

const setNodeEnv = (value: string) => {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value,
    configurable: true,
  });
};

describe('shouldExposeStoreOnWindow', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    setNodeEnv(originalNodeEnv as string);
    jest.clearAllMocks();
  });

  it('exposes outside production regardless of Playwright', () => {
    setNodeEnv('development');
    mockIsPlaywrightEnv.mockReturnValue(false);

    expect(shouldExposeStoreOnWindow()).toBe(true);
  });

  it('exposes in a production build when running under Playwright', () => {
    setNodeEnv('production');
    mockIsPlaywrightEnv.mockReturnValue(true);

    expect(shouldExposeStoreOnWindow()).toBe(true);
  });

  it('stays closed for a real production visitor', () => {
    setNodeEnv('production');
    mockIsPlaywrightEnv.mockReturnValue(false);

    expect(shouldExposeStoreOnWindow()).toBe(false);
  });
});
