/**
 * @jest-environment node
 */

const mockGenerateContent = jest.fn();

jest.mock('@/lib/ai/geminiClient', () => ({
  GeminiClient: jest.fn().mockImplementation(() => ({
    generateContent: mockGenerateContent,
  })),
}));
jest.mock('@/lib/ai/config', () => ({
  getDefaultConfig: jest.fn(() => ({ apiKey: 'test-api-key' })),
}));
jest.mock('@/lib/ai/resolveApiKey', () => ({
  resolveApiKey: jest.fn(() => 'test-api-key'),
}));
jest.mock('@/lib/utils/logger', () => {
  return jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  }));
});

import { NextRequest } from 'next/server';
import { POST } from '../route';

const makeRequest = (body: unknown) =>
  new NextRequest('http://localhost:3000/api/lore/check-similarity', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('/api/lore/check-similarity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateContent.mockResolvedValue({
      content: '{"similar": true, "confidence": 0.9, "rationale": "same person"}',
    });
  });

  it('returns 400 when a name is missing', async () => {
    const response = await POST(makeRequest({ name1: 'Maya' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Both name1 and name2 are required');
  });

  it('asks the model to treat role/descriptor aliases as the same entity', async () => {
    await POST(makeRequest({ name1: 'Maya the counselor', name2: 'Maya Chandra', category: 'characters' }));

    const prompt = mockGenerateContent.mock.calls[0][0];
    expect(prompt).toContain('Role or descriptor references');
    expect(prompt).toContain('role, title, or descriptor attached to a shared given name');
  });
});
