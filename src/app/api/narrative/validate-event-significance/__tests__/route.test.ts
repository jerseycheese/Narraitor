/**
 * @jest-environment node
 */

/**
 * This route does not go through the provider adapter or the default client —
 * the validator constructs the Gemini SDK directly — so the SDK is the client
 * to fake. Everything downstream of the model's string then runs for real:
 * prompt assembly, the JSON recovery, and the fail-open behavior that decides
 * what happens when the model answers with something unusable.
 */

const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
}));

import { POST } from '../route';
import { GoogleGenAI } from '@google/genai';
import { buildAIRequest } from '../../../__tests__/routeHarness';

const mockGenAI = GoogleGenAI as unknown as jest.Mock;

const validateRequest = (body: unknown) =>
  buildAIRequest('/api/narrative/validate-event-significance', body);

describe('POST /api/narrative/validate-event-significance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects a missing majorEvent before reaching the model', async () => {
    const response = await POST(validateRequest({ context: { location: 'Ruins' } }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('majorEvent is required and must be a string');
    expect(mockGenAI).not.toHaveBeenCalled();
  });

  it('rejects a majorEvent that is not a string', async () => {
    const response = await POST(validateRequest({ majorEvent: { text: 'found the key' } }));

    expect(response.status).toBe(400);
    expect(mockGenAI).not.toHaveBeenCalled();
  });

  it('returns the verdict and puts the caller context in the prompt', async () => {
    mockGenerateContent.mockResolvedValue({
      text: '{"isSignificant": false, "reason": "Movement, not arrival"}',
    });

    const response = await POST(
      validateRequest({
        majorEvent: 'The player descends further into the shaft',
        context: { location: 'The Shaft', characterName: 'Wren' },
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      isSignificant: false,
      reason: 'Movement, not arrival',
    });

    const prompt = mockGenerateContent.mock.calls[0][0].contents as string;
    expect(prompt).toContain('The player descends further into the shaft');
    expect(prompt).toContain('Location: The Shaft');
    expect(prompt).toContain('Character: Wren');
  });

  it('accepts the event when the model answers with something unparseable', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'Probably significant, yes.' });

    const response = await POST(
      validateRequest({ majorEvent: 'The player opens the vault' })
    );
    const data = await response.json();

    // Fail open: an unreadable verdict must not silently swallow a checkpoint.
    expect(response.status).toBe(200);
    expect(data.isSignificant).toBe(true);
    expect(data.reason).toContain('Parse error');
  });

  it('accepts the event when the model call fails outright', async () => {
    mockGenerateContent.mockRejectedValue(new Error('upstream refused'));

    const response = await POST(
      validateRequest({ majorEvent: 'The player opens the vault' })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isSignificant).toBe(true);
    expect(data.reason).toContain('upstream refused');
  });

  it('returns 500 when the body is not JSON', async () => {
    const response = await POST(validateRequest('{"majorEvent":'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to validate event significance');
    expect(mockGenAI).not.toHaveBeenCalled();
  });
});
