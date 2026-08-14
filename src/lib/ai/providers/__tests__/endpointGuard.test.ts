/**
 * @jest-environment node
 */
jest.mock('node:dns/promises', () => ({ lookup: jest.fn() }));

import { assertPublicProviderEndpoint } from '../endpointGuard';
import { lookup } from 'node:dns/promises';

const mockLookup = lookup as jest.MockedFunction<typeof lookup>;

const PUBLIC = [{ address: '104.18.0.1', family: 4 }];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('assertPublicProviderEndpoint', () => {
  it('allows a public https endpoint that resolves publicly', async () => {
    mockLookup.mockResolvedValue(PUBLIC as never);

    await expect(
      assertPublicProviderEndpoint('https://openrouter.ai/api/v1/chat/completions')
    ).resolves.toBeUndefined();
  });

  /**
   * The case the string check cannot catch: an ordinary public hostname, under
   * the attacker's control, whose A record points somewhere internal.
   */
  it.each([
    ['169.254.169.254', 'cloud instance metadata'],
    ['127.0.0.1', 'loopback'],
    ['10.1.2.3', 'RFC 1918'],
    ['100.64.0.1', 'carrier-grade NAT'],
  ])('refuses a hostname resolving to %s (%s)', async (address) => {
    mockLookup.mockResolvedValue([{ address, family: 4 }] as never);

    await expect(assertPublicProviderEndpoint('https://evil.example/v1')).rejects.toThrow(
      /private address/
    );
  });

  it('refuses when any one of several addresses is private', async () => {
    mockLookup.mockResolvedValue([
      { address: '104.18.0.1', family: 4 },
      { address: '169.254.169.254', family: 4 },
    ] as never);

    await expect(assertPublicProviderEndpoint('https://evil.example/v1')).rejects.toThrow(
      /private address/
    );
  });

  it('refuses rather than guesses when the name will not resolve', async () => {
    mockLookup.mockRejectedValue(new Error('ENOTFOUND'));

    await expect(assertPublicProviderEndpoint('https://nope.example/v1')).rejects.toThrow(
      /could not be resolved/
    );
  });

  it('rejects on the string check before spending a lookup', async () => {
    await expect(assertPublicProviderEndpoint('http://api.openai.com/v1')).rejects.toThrow(
      /https URL on a public host/
    );
    expect(mockLookup).not.toHaveBeenCalled();
  });
});
