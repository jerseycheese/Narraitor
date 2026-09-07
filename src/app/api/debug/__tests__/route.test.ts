/**
 * @jest-environment node
 */

/**
 * No seam to choose: the route reads two environment variables and answers.
 * Nothing is faked.
 */

import { GET } from '../route';

const setNodeEnv = (value: string) => {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
};

describe('GET /api/debug', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalApiKey = process.env.GEMINI_API_KEY;

  afterEach(() => {
    setNodeEnv(originalNodeEnv as string);
    process.env.GEMINI_API_KEY = originalApiKey;
  });

  it('reports whether a server key is configured outside production', async () => {
    setNodeEnv('development');
    process.env.GEMINI_API_KEY = 'a-server-key';

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      apiKeyConfigured: true,
      nodeEnv: 'development',
      security: 'server-side-only',
    });
  });

  it('reports no key when the environment has none', async () => {
    setNodeEnv('development');
    delete process.env.GEMINI_API_KEY;

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.apiKeyConfigured).toBe(false);
  });

  it('is not reachable in production', async () => {
    setNodeEnv('production');
    process.env.GEMINI_API_KEY = 'a-server-key';

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Debug endpoint not available in production');
    // Nothing about the deployment leaks alongside the 404.
    expect(data.apiKeyConfigured).toBeUndefined();
    expect(data.nodeEnv).toBeUndefined();
  });
});
