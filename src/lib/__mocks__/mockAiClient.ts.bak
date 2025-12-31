/**
 * MockAIClient for testing narrative generation with decision consequences
 */

import { AIClient, AIResponse } from '../ai/types';

export class MockAIClient implements AIClient {
  private prompts: string[] = [];
  private mockResponse: AIResponse = {
    content: 'Generated narrative content with decision references',
    finishReason: 'STOP',
    promptTokens: 100,
    completionTokens: 200
  };
  private responseQueue: AIResponse[] = [];

  async generateContent(prompt: string): Promise<AIResponse> {
    this.prompts.push(prompt);
    if (this.responseQueue.length > 0) {
      return Promise.resolve(this.responseQueue.shift() as AIResponse);
    }
    return Promise.resolve(this.mockResponse);
  }

  getLastPrompt(): string {
    return this.prompts[this.prompts.length - 1] || '';
  }

  getPrompts(): string[] {
    return this.prompts;
  }

  setMockResponse(response: Partial<AIResponse>): void {
    this.mockResponse = {
      ...this.mockResponse,
      ...response
    };
  }

  setMockResponses(responses: Array<Partial<AIResponse>>): void {
    this.responseQueue = responses.map((response) => ({
      ...this.mockResponse,
      ...response,
    }));
  }

  reset(): void {
    this.prompts = [];
    this.mockResponse = {
      content: 'Generated narrative content with decision references',
      finishReason: 'STOP',
      promptTokens: 100,
      completionTokens: 200
    };
    this.responseQueue = [];
  }
}
