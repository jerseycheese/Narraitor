import { trackFunnelStep } from '../trackFunnelStep';
import { track } from '@vercel/analytics';
import { isPlaywrightEnv } from '@/lib/utils/isPlaywrightEnv';

jest.mock('@vercel/analytics', () => ({ track: jest.fn() }));
jest.mock('@/lib/utils/isPlaywrightEnv', () => ({ isPlaywrightEnv: jest.fn() }));

const mockTrack = track as jest.Mock;
const mockIsPlaywright = isPlaywrightEnv as jest.Mock;

/**
 * MVP coverage for the analytics funnel helper (#1367). The tests pin the
 * hard privacy constraint that keeps the privacy note (#1366) true: only the
 * funnel-step name ever leaves the browser, and nothing fires under Playwright.
 */
describe('trackFunnelStep (#1367)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPlaywright.mockReturnValue(false);
  });

  it('sends only the funnel-step name — never a content-bearing payload', () => {
    trackFunnelStep('session-started');

    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith('session-started');
    // Exactly one argument: there is no props object that could carry world
    // names, prompts, or any other user content.
    expect(mockTrack.mock.calls[0]).toHaveLength(1);
  });

  it('no-ops under Playwright so the E2E/visual suite stays deterministic', () => {
    mockIsPlaywright.mockReturnValue(true);

    trackFunnelStep('landing');

    expect(mockTrack).not.toHaveBeenCalled();
  });

  it('accepts the turn-level events and gates them the same as the others', () => {
    trackFunnelStep('narrative-turn');
    trackFunnelStep('session-ended');

    expect(mockTrack).toHaveBeenNthCalledWith(1, 'narrative-turn');
    expect(mockTrack).toHaveBeenNthCalledWith(2, 'session-ended');

    mockIsPlaywright.mockReturnValue(true);
    mockTrack.mockClear();

    trackFunnelStep('narrative-turn');
    trackFunnelStep('session-ended');

    expect(mockTrack).not.toHaveBeenCalled();
  });
});
