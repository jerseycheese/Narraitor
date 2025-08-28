// src/lib/ai/developerMockClient.ts

import { AIClient, AIResponse, AIImageResponse, AIServiceError, MockConfiguration, MockScenario } from './types';

/**
 * Mock AI client for developer testing and debugging
 * Provides scenario-based responses with configurable delays and errors
 */
export class DeveloperMockClient implements AIClient {
  private configuration: MockConfiguration;

  constructor(configuration: MockConfiguration) {
    this.configuration = configuration;
  }

  /**
   * Update mock configuration
   */
  updateConfiguration(newConfig: Partial<MockConfiguration>): void {
    this.configuration = { ...this.configuration, ...newConfig };
  }

  /**
   * Generate mock content response based on active scenario
   */
  async generateContent(prompt: string): Promise<AIResponse> {
    if (!this.configuration.enabled) {
      throw new Error('Developer mock client is disabled');
    }

    const scenario = this.getActiveScenario();
    await this.simulateDelay(scenario);

    switch (scenario.type) {
      case 'error':
        throw this.createError(scenario);
      case 'timeout':
        await this.simulateTimeout();
        throw this.createTimeoutError();
      case 'success':
        return this.createSuccessResponse(prompt, scenario);
      case 'custom':
        return this.createCustomResponse(prompt, scenario);
      default:
        return this.createDefaultResponse(prompt);
    }
  }

  /**
   * Generate mock image response
   */
  async generateImage(prompt: string): Promise<AIImageResponse> {
    if (!this.configuration.enabled) {
      throw new Error('Developer mock client is disabled');
    }

    const scenario = this.getActiveScenario();
    await this.simulateDelay(scenario);

    if (scenario.type === 'error') {
      throw this.createError(scenario);
    }

    return {
      image: 'data:image/svg+xml;base64,' + btoa(`
        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f3f4f6"/>
          <text x="200" y="150" text-anchor="middle" fill="#374151" font-size="16" font-family="Arial">
            Mock Image for: ${prompt.substring(0, 30)}...
          </text>
        </svg>
      `),
      prompt
    };
  }

  /**
   * Generate mock structured content
   */
  async generateStructuredContent<T = unknown>(prompt: string, schema: unknown): Promise<T> {
    if (!this.configuration.enabled) {
      throw new Error('Developer mock client is disabled');
    }

    const scenario = this.getActiveScenario();
    await this.simulateDelay(scenario);

    if (scenario.type === 'error') {
      throw this.createError(scenario);
    }

    // Return a mock structured response that matches common patterns
    return {
      success: true,
      data: {
        prompt: prompt.substring(0, 50),
        schema: typeof schema,
        scenario: scenario.name,
        timestamp: new Date().toISOString()
      }
    } as T;
  }

  /**
   * Check if mock client is available
   */
  async isAvailable(): Promise<boolean> {
    return this.configuration.enabled;
  }

  /**
   * Get the active scenario configuration
   */
  private getActiveScenario(): MockScenario {
    const scenario = this.configuration.scenarios.find(s => s.id === this.configuration.activeScenario);
    return scenario || this.getDefaultScenario();
  }

  /**
   * Simulate network delay
   */
  private async simulateDelay(scenario: MockScenario): Promise<void> {
    let delay = scenario.delay || this.configuration.globalDelay;

    if (this.configuration.enableDelayVariation && delay > 0) {
      // Add ±25% variation to make it more realistic
      const variation = delay * 0.25;
      delay = delay + (Math.random() - 0.5) * 2 * variation;
    }

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, Math.max(0, delay)));
    }
  }

  /**
   * Simulate timeout scenario
   */
  private async simulateTimeout(): Promise<void> {
    // Simulate a long delay before throwing timeout error
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  /**
   * Create error based on scenario
   */
  private createError(scenario: MockScenario): AIServiceError {
    const error = scenario.error || {
      code: 'MOCK_ERROR',
      message: `Mock error from scenario: ${scenario.name}`,
      retryable: true
    };
    
    // Create an Error object with AIServiceError properties
    const errorObj = new Error(error.message) as Error & AIServiceError;
    errorObj.code = error.code;
    errorObj.retryable = error.retryable;
    
    return errorObj;
  }

  /**
   * Create timeout error
   */
  private createTimeoutError(): AIServiceError {
    const error = {
      code: 'TIMEOUT',
      message: 'Mock request timeout',
      retryable: true
    };
    
    // Create an Error object with AIServiceError properties
    const errorObj = new Error(error.message) as Error & AIServiceError;
    errorObj.code = error.code;
    errorObj.retryable = error.retryable;
    
    return errorObj;
  }

  /**
   * Create success response
   */
  private createSuccessResponse(prompt: string, scenario: MockScenario): AIResponse {
    const baseResponse: AIResponse = {
      content: this.generateMockContent(prompt, scenario),
      finishReason: 'STOP',
      promptTokens: this.estimateTokens(prompt),
      completionTokens: Math.floor(Math.random() * 500) + 100
    };

    return scenario.response ? { ...baseResponse, ...scenario.response } : baseResponse;
  }

  /**
   * Create custom response from scenario
   */
  private createCustomResponse(prompt: string, scenario: MockScenario): AIResponse {
    const defaultResponse = this.createSuccessResponse(prompt, scenario);
    return scenario.response ? { ...defaultResponse, ...scenario.response } : defaultResponse;
  }

  /**
   * Create default response
   */
  private createDefaultResponse(prompt: string): AIResponse {
    return {
      content: `Mock response for: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`,
      finishReason: 'STOP',
      promptTokens: this.estimateTokens(prompt),
      completionTokens: Math.floor(Math.random() * 300) + 50
    };
  }

  /**
   * Generate contextually appropriate mock content
   */
  private generateMockContent(prompt: string, scenario: MockScenario): string {
    const promptLower = prompt.toLowerCase();

    // Contextual responses based on prompt content
    if (promptLower.includes('character') || promptLower.includes('hero')) {
      return `**Mock Character Response** (${scenario.name})

A brave adventurer stands before you, their eyes gleaming with determination. They carry themselves with quiet confidence, suggesting years of experience in dangerous situations.

*"I've seen much in my travels, but this place... this feels different. There's an energy here that sets my teeth on edge."*

**Stats:** Courage: High | Wisdom: Moderate | Combat Experience: Extensive

[This is a mock response for testing purposes]`;
    }

    if (promptLower.includes('world') || promptLower.includes('setting')) {
      return `**Mock World Response** (${scenario.name})

The ancient city stretches out before you, its crystalline towers reaching toward storm-darkened skies. Magic crackles through the air like static electricity, and the very stones seem to hum with power.

**Key Features:**
- Floating market squares suspended by arcane energy
- Libraries containing knowledge from a thousand civilizations  
- Underground networks where rebels plot against the ruling Council of Mages

*The air tastes of copper and ozone. Something important is about to happen.*

[This is a mock response for testing purposes]`;
    }

    if (promptLower.includes('choice') || promptLower.includes('decision')) {
      return `**Mock Choice Response** (${scenario.name})

Three paths lie before you:

**1. The Scholar's Path** - Research the ancient texts for clues about what's happening
*Requires: Intelligence, patience. Risk: Missing time-sensitive opportunities*

**2. The Warrior's Path** - Confront the threat directly with force  
*Requires: Courage, combat skill. Risk: Escalating the conflict*

**3. The Diplomat's Path** - Try to negotiate and find common ground
*Requires: Charisma, cultural knowledge. Risk: Being deceived*

*Each choice will have lasting consequences for your story.*

[This is a mock response for testing purposes]`;
    }

    // Default narrative response
    return `**Mock Narrative Response** (${scenario.name})

The story continues to unfold around you. The mock AI has generated this response based on your prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"

This response demonstrates the mock system's ability to:
- Generate contextually appropriate content
- Maintain narrative flow
- Provide consistent formatting
- Include realistic token usage simulation

*The adventure continues, powered by developer-friendly mock responses.*

[This is a mock response for testing purposes - Scenario: ${scenario.name}]`;
  }

  /**
   * Estimate token count for a string (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough approximation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Get default scenario if none configured
   */
  private getDefaultScenario(): MockScenario {
    return {
      id: 'default',
      name: 'Default Success',
      type: 'success',
      delay: 1000,
      description: 'Default mock scenario'
    };
  }
}