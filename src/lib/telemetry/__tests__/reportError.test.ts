import { reportError } from '../reportError';
import { isPlaywrightEnv } from '@/lib/utils/isPlaywrightEnv';

jest.mock('@/lib/utils/isPlaywrightEnv', () => ({ isPlaywrightEnv: jest.fn() }));

const mockIsPlaywright = isPlaywrightEnv as jest.Mock;

/**
 * MVP coverage for the client transport gates (#1641): dev stays console-only
 * and the E2E/visual suite never sees a beacon, matching trackFunnelStep.
 */
describe('reportError transport gates (#1641)', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let sendBeacon: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPlaywright.mockReturnValue(false);
    sendBeacon = jest.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'sendBeacon', {
      value: sendBeacon,
      configurable: true,
    });
  });

  afterEach(() => {
    setNodeEnv(originalNodeEnv);
  });

  // NODE_ENV is readonly in the Next type surface; the test needs to move it.
  function setNodeEnv(value: string | undefined) {
    Object.defineProperty(process.env, 'NODE_ENV', { value, configurable: true });
  }

  it('no-ops outside production so dev stays console-only', () => {
    setNodeEnv('development');

    reportError(new Error('boom'));

    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it('no-ops under Playwright even in a production build', () => {
    setNodeEnv('production');
    mockIsPlaywright.mockReturnValue(true);

    reportError(new Error('boom'));

    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it('beacons the sanitized report in production', () => {
    setNodeEnv('production');

    reportError(new Error('boom'), { source: 'global-error' });

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    expect(sendBeacon.mock.calls[0][0]).toBe('/api/telemetry/error');
  });
});
