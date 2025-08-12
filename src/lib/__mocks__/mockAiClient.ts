/**
 * MockAIClient for testing narrative generation with decision consequences
 */

import { AIClient, AIResponse } from '../ai/types';

export class MockAIClient implements AIClient {
  private lastPrompt: string = '';
  private mockResponse: AIResponse = {
    content: 'Generated narrative content with decision references',
    finishReason: 'STOP',
    promptTokens: 100,
    completionTokens: 200
  };

  async generateContent(prompt: string): Promise<AIResponse> {
    this.lastPrompt = prompt;
    return Promise.resolve(this.mockResponse);
  }

  getLastPrompt(): string {
    return this.lastPrompt;
  }

  setMockResponse(response: Partial<AIResponse>): void {
    this.mockResponse = {
      ...this.mockResponse,
      ...response
    };
  }

  reset(): void {
    this.lastPrompt = '';
    this.mockResponse = {
      content: 'Generated narrative content with decision references',
      finishReason: 'STOP',
      promptTokens: 100,
      completionTokens: 200
    };
  }
}