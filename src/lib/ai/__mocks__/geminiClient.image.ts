// src/lib/ai/__mocks__/geminiClient.image.ts

import { AIClient, AIImageResponse } from '../types';
import { MockGeminiClient } from './geminiClient.mock';

/**
 * Mock Gemini client with image generation for testing
 */
export class MockGeminiImageClient extends MockGeminiClient implements AIClient {
  async generateImage(prompt: string): Promise<AIImageResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Generate a simple SVG for testing
    const svg = `
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#6366f1"/>
        <circle cx="50" cy="40" r="15" fill="white" opacity="0.8"/>
        <ellipse cx="50" cy="75" rx="20" ry="15" fill="white" opacity="0.8"/>
        <text x="50" y="90" font-family="Arial" font-size="8" fill="white" text-anchor="middle">Test</text>
      </svg>
    `;
    const svgDataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
    
    return {
      image: svgDataUrl,
      prompt: prompt
    };
  }
}
