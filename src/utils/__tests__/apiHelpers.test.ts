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

import { getSafetySettingsFromPrompt } from '../apiHelpers';

describe('getSafetySettingsFromPrompt', () => {
  it('returns BLOCK_MEDIUM_AND_ABOVE for G-rated content', () => {
    const prompt = `
      Generate a story about adventure.
      
      TONE SETTINGS:
      Content Rating: G
      Narrative Style: Serious
      Language Complexity: Simple
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
      TONE SETTINGS:
      Content Rating: PG
      Narrative Style: Serious
      Language Complexity: Simple
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
      TONE SETTINGS:
      Content Rating: PG-13
      Narrative Style: Serious
      Language Complexity: Simple
    `;
    
    const safetySettings = getSafetySettingsFromPrompt(prompt);
    
    expect(safetySettings).toEqual([
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
    ]);
  });

  it('returns BLOCK_ONLY_HIGH for R-rated content', () => {
    const prompt = `
      TONE SETTINGS:
      Content Rating: R
      Narrative Style: Serious
      Language Complexity: Simple
    `;
    
    const safetySettings = getSafetySettingsFromPrompt(prompt);
    
    expect(safetySettings).toEqual([
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
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

  it('is case insensitive when matching content ratings', () => {
    const prompt = `
      TONE SETTINGS:
      Content Rating: g
      Narrative Style: Serious
      Language Complexity: Simple
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