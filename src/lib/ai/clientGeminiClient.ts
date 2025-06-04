// src/lib/ai/clientGeminiClient.ts

import { AIClient, AIResponse, AIImageResponse } from './types';
import { userFriendlyError } from './userFriendlyErrors';

/**
 * Client-side proxy for Gemini API that routes through Next.js API routes
 * This ensures API keys are never exposed to the client
 */
export class ClientGeminiClient implements AIClient {
  private baseUrl: string;

  constructor() {
    // Use relative URLs so they work in both development and production
    this.baseUrl = '';
  }

  /**
   * Generate content via server-side API route
   * Automatically routes to the appropriate endpoint based on prompt content
   */
  async generateContent(prompt: string): Promise<AIResponse> {
    try {
      // Detect if this is a choice generation request based on prompt content
      const isChoiceGeneration = this.isChoiceGenerationPrompt(prompt);
      const endpoint = isChoiceGeneration ? '/api/narrative/choices' : '/api/narrative/generate';
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          config: {
            temperature: 0.7,
            maxTokens: 2048
          }
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limiting error
          const data = await response.json();
          throw new Error(data.error || 'Rate limit exceeded. Please try again later.');
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.content,
        finishReason: data.finishReason || 'STOP',
        promptTokens: data.promptTokens,
        completionTokens: data.completionTokens
      };
    } catch (error) {
      console.error('ClientGeminiClient error:', error);
      
      // Use existing error handling utilities
      const friendlyMessage = userFriendlyError(error instanceof Error ? error : new Error('Unknown error'));
      throw new Error(friendlyMessage);
    }
  }

  /**
   * Detect if a prompt is for choice generation based on content patterns
   */
  private isChoiceGenerationPrompt(prompt: string): boolean {
    const choiceIndicators = [
      'create 4 distinct action choices',
      'generate player choices',
      'ALIGNMENT DEFINITIONS',
      'alignedPlayerChoice',
      'playerChoice',
      'create choices',
      'decision options'
    ];
    
    const lowerPrompt = prompt.toLowerCase();
    return choiceIndicators.some(indicator => lowerPrompt.includes(indicator.toLowerCase()));
  }

  /**
   * Generate choices via server-side API route
   * This method is used specifically for choice generation
   */
  async generateChoices(prompt: string): Promise<AIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/narrative/choices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          config: {
            temperature: 0.7,
            maxTokens: 2048
          }
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limiting error
          const data = await response.json();
          throw new Error(data.error || 'Rate limit exceeded. Please try again later.');
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.content,
        finishReason: data.finishReason || 'STOP',
        promptTokens: data.promptTokens,
        completionTokens: data.completionTokens
      };
    } catch (error) {
      console.error('ClientGeminiClient choice generation error:', error);
      
      // Use existing error handling utilities
      const friendlyMessage = userFriendlyError(error instanceof Error ? error : new Error('Unknown error'));
      throw new Error(friendlyMessage);
    }
  }

  /**
   * Generate portrait image via existing server-side API route
   */
  async generateImage(prompt: string): Promise<AIImageResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate-portrait`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limiting error
          const data = await response.json();
          throw new Error(data.error || 'Rate limit exceeded. Please try again later.');
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        image: data.image,
        prompt: data.prompt
      };
    } catch (error) {
      console.error('ClientGeminiClient image generation error:', error);
      
      // Use existing error handling utilities
      const friendlyMessage = userFriendlyError(error instanceof Error ? error : new Error('Unknown error'));
      throw new Error(friendlyMessage);
    }
  }

  /**
   * Check if the AI service is available
   * This makes a lightweight request to verify the API routes are working
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Make a simple request to check if the API is responding
      const response = await fetch(`${this.baseUrl}/api/narrative/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'test',
          config: { maxTokens: 1 }
        })
      });

      // Any response (even errors) means the API route is available
      return response.status !== 404;
    } catch (error) {
      console.error('ClientGeminiClient availability check failed:', error);
      return false;
    }
  }
}
