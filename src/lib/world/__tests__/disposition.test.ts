import { getTrustDisposition, formatDisposition } from '../relationships/disposition';

describe('getTrustDisposition', () => {
  it.each([
    [0, 'hostile'],
    [24, 'hostile'],
    [25, 'wary'],
    [40, 'wary'],
    [41, 'neutral'],
    [59, 'neutral'],
    [60, 'friendly'],
    [74, 'friendly'],
    [75, 'trusted'],
    [100, 'trusted'],
  ] as const)('maps trust %i to %s', (trust, expected) => {
    expect(getTrustDisposition(trust)).toBe(expected);
  });
});

describe('formatDisposition', () => {
  it('capitalizes the label', () => {
    expect(formatDisposition('wary')).toBe('Wary');
  });
});
