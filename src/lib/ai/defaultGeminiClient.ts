import { GeminiClient } from './geminiClient';
import { getDefaultConfig } from './config';
import { AIResponse } from './types';

// For development/test environments, use mock implementation
class MockGeminiClient implements GeminiClient {
  async generateContent(prompt: string): Promise<AIResponse> {
    console.log('Using mock Gemini client');
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate appropriate response based on prompt content
    const isInitialScene = prompt.includes('initialScene') || prompt.includes('opening scene');
    
    if (isInitialScene) {
      return {
        content: 'You find yourself at the entrance of a mysterious cave. The air is cool and damp, and you can hear the distant sound of dripping water echoing from within. Strange symbols are carved into the stone archway above you, hinting at ancient secrets waiting to be discovered.',
        finishReason: 'STOP',
        promptTokens: 100,
        completionTokens: 200
      };
    } else {
      return {
        content: 'As you venture deeper into the unknown, the path narrows and the walls glisten with moisture. The symbols on the walls seem to pulse with a faint blue light, responding to your presence. A sense of both wonder and trepidation fills you as you continue your exploration.',
        finishReason: 'STOP',
        promptTokens: 120,
        completionTokens: 180
      };
    }
  }
}

// Create a default instance of GeminiClient for narrative generation
export const createDefaultGeminiClient = () => {
  // In production, use real client
  if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_API_KEY) {
    return new GeminiClient(getDefaultConfig());
  }
  
  // Otherwise, use mock client for development/testing
  return new MockGeminiClient();
};