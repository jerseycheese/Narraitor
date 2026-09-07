/**
 * @jest-environment node
 */

/**
 * Image generation never goes through the text provider adapter, so `fetch` is
 * not the seam here. The image client is faked — the same seam the other image
 * routes already use — which leaves the route's own work running for real: the
 * input check, the prompt it builds from the item, and the choice between a
 * real generation, the placeholder, and a 500.
 */

jest.mock('@/lib/ai/geminiImageGenerator', () => ({
  generateImageWithGemini: jest.fn(),
}));

import { POST } from '../route';
import { generateImageWithGemini } from '@/lib/ai/geminiImageGenerator';
import { buildAIRequest } from '../../__tests__/routeHarness';

const mockGenerate = generateImageWithGemini as jest.MockedFunction<
  typeof generateImageWithGemini
>;

const itemRequest = (body: unknown, options?: { withoutKey?: boolean }) =>
  buildAIRequest('/api/generate-item-image', body, options);

const ITEM = { name: 'Rusty Iron Sword', description: 'A pitted blade' };

describe('POST /api/generate-item-image', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects a request with no item before generating anything', async () => {
    const response = await POST(itemRequest({ genre: 'fantasy' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Item object is required');
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('returns the generated image and sends a prompt built from the item', async () => {
    mockGenerate.mockResolvedValue({
      url: 'data:image/png;base64,abc123',
      mimeType: 'image/png',
      base64Data: 'abc123',
    });

    const response = await POST(itemRequest({ item: ITEM }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.image.type).toBe('ai-generated');
    expect(data.image.url).toBe('data:image/png;base64,abc123');

    const [prompt, apiKey] = mockGenerate.mock.calls[0];
    expect(prompt).toContain('Rusty Iron Sword');
    expect(prompt).toContain('A pitted blade');
    expect(prompt).toContain('white background');
    // The player's own key, taken off the request rather than the environment.
    expect(apiKey).toBe('test-provider-key');
  });

  it('serves a placeholder when the request resolves no key', async () => {
    const response = await POST(itemRequest({ item: ITEM }, { withoutKey: true }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.image.type).toBe('placeholder');
    expect(data.image.url).toContain('api.dicebear.com/7.x/shapes/svg');
    expect(data.image.url).toContain('seed=Rusty+Iron+Sword');
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('serves a placeholder when generation returns no image', async () => {
    mockGenerate.mockResolvedValue(null);

    const response = await POST(itemRequest({ item: ITEM }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.image.type).toBe('placeholder');
    expect(data.image.url).toContain('api.dicebear.com');
  });

  /**
   * Pinning what the route DOES, which is not what it reads like it does.
   *
   * The handler ends in `return generateImageWithFallback(...)` with no await,
   * so a hard failure rejects after the try block has already been left and
   * the route's own catch — the one that answers 'Failed to generate item
   * image' — never runs. Every other image route awaits the helper inside its
   * try and gets a shaped 500. Filed as a follow-up rather than fixed here:
   * this PR is coverage only, and the fix is a production change.
   */
  it('rejects instead of answering 500 when generation fails hard', async () => {
    mockGenerate.mockRejectedValue(new Error('quota exhausted'));

    await expect(POST(itemRequest({ item: ITEM }))).rejects.toThrow('quota exhausted');
  });
});
