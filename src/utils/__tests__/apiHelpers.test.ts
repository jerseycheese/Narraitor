// Mock Next.js modules
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn()
  }
}));

jest.mock('../rateLimiter', () => ({
  globalRateLimiter: {
    checkLimit: jest.fn(() => ({ allowed: true, remaining: 50, resetTime: Date.now() + 3600000 }))
  },
  RateLimiter: {
    getErrorMessage: jest.fn()
  }
}));

import { getSafetySettingsFromPrompt, makeGeminiRequest } from '../apiHelpers';
import { getAIConfig } from '../../lib/ai/config';
import { GEMINI_ATTEMPT_TIMEOUT_MS } from '../../lib/constants/aiTimeouts';

describe('getSafetySettingsFromPrompt', () => {
  it('returns BLOCK_MEDIUM_AND_ABOVE for G-rated content', () => {
    const prompt = `
      Generate a story about adventure.
      
      G-RATED CONTENT GUIDELINES:
      - NO violence, weapons, fighting, or physical harm
      - Focus on wholesome adventure and friendship
    `;
    
    const safetySettings = getSafetySettingsFromPrompt(prompt);
    
    expect(safetySettings).toEqual([
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
    ]);
  });

  it('returns BLOCK_ONLY_HIGH for PG-rated content', () => {
    const prompt = `
      PG-RATED CONTENT GUIDELINES:
      - Mild fantasy violence only
      - Gentle themes of conflict and resolution
    `;
    
    const safetySettings = getSafetySettingsFromPrompt(prompt);
    
    expect(safetySettings).toEqual([
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
    ]);
  });

  it('returns BLOCK_ONLY_HIGH for PG-13 content', () => {
    const prompt = `
      PG-13 CONTENT GUIDELINES:
      - Moderate fantasy violence with some detail
      - Themes of loss and sacrifice
    `;
    
    const safetySettings = getSafetySettingsFromPrompt(prompt);
    
    expect(safetySettings).toEqual([
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
    ]);
  });

  it('returns BLOCK_NONE for sexually explicit content for R-rated', () => {
    const prompt = `
      R-RATED CONTENT GUIDELINES:
      - Realistic violence with consequences
      - Strong language and mature themes
    `;

    const safetySettings = getSafetySettingsFromPrompt(prompt);

    expect(safetySettings).toEqual([
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
    ]);
  });

  it('returns default BLOCK_MEDIUM_AND_ABOVE when no content rating found', () => {
    const prompt = 'Generate a story about adventure.';
    
    const safetySettings = getSafetySettingsFromPrompt(prompt);
    
    expect(safetySettings).toEqual([
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
    ]);
  });

  it('returns BLOCK_NONE for sexually explicit content for NC-17', () => {
    const prompt = `
      NC-17 CONTENT GUIDELINES:
      - Intense, realistic scenarios with serious consequences
      - Strong language and complex mature themes
    `;

    const safetySettings = getSafetySettingsFromPrompt(prompt);

    expect(safetySettings).toEqual([
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
    ]);
  });

  it('is case insensitive when matching content ratings', () => {
    const prompt = `
      g-rated content guidelines:
      - NO violence, weapons, fighting, or physical harm
      - Focus on wholesome adventure and friendship
    `;
    
    const safetySettings = getSafetySettingsFromPrompt(prompt);
    
    expect(safetySettings).toEqual([
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
    ]);
  });
});

describe('makeGeminiRequest', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('uses configured text model name in request URL', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({}) });

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${getAIConfig().modelName}:generateContent`;
    await makeGeminiRequest(endpoint, 'test-key', {});

    expect(global.fetch).toHaveBeenCalledWith(endpoint, expect.any(Object));
  });

  it('rejects at the shared single-attempt budget when the upstream hangs', async () => {
    jest.useFakeTimers();
    try {
      // Hang forever, but honor the abort signal like a real fetch would.
      (global.fetch as jest.Mock).mockImplementation(
        (_endpoint: string, init: RequestInit) =>
          new Promise((_, reject) => {
            init.signal?.addEventListener('abort', () =>
              reject(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }))
            );
          })
      );

      const pending = makeGeminiRequest('https://example.test/gemini', 'test-key', {});
      const outcome = expect(pending).rejects.toThrow('Request timeout - please try again');

      // Still in-flight just before the 30s budget…
      jest.advanceTimersByTime(GEMINI_ATTEMPT_TIMEOUT_MS - 1);
      // …and aborted the moment it elapses.
      jest.advanceTimersByTime(1);

      await outcome;
    } finally {
      jest.useRealTimers();
    }
  });
});
