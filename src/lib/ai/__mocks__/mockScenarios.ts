// src/lib/ai/__mocks__/mockScenarios.ts

import { AIResponse, AIServiceError } from '../types';

/**
 * Mock scenario configuration for developer testing
 */
export interface MockScenario {
  id: string;
  name: string;
  description: string;
  response: AIResponse | AIServiceError;
  delay: number; // milliseconds
  shouldSucceed: boolean;
}

/**
 * Predefined mock scenarios for common testing situations
 */
export const PREDEFINED_SCENARIOS: MockScenario[] = [
  {
    id: 'success-standard',
    name: 'Standard Success',
    description: 'Normal successful response with typical content',
    response: {
      content: 'This is a mock AI response for testing purposes. The response simulates a typical successful API call with realistic content length and structure.',
      finishReason: 'STOP',
      promptTokens: 42,
      completionTokens: 28
    },
    delay: 1200,
    shouldSucceed: true
  },
  {
    id: 'success-slow',
    name: 'Slow Success',
    description: 'Successful but slow response to test loading states',
    response: {
      content: 'This is a slow mock response that helps test loading indicators and user patience. It simulates network delays or heavy processing.',
      finishReason: 'STOP',
      promptTokens: 38,
      completionTokens: 32
    },
    delay: 4000,
    shouldSucceed: true
  },
  {
    id: 'success-fast',
    name: 'Fast Success',
    description: 'Quick successful response for rapid testing',
    response: {
      content: 'Quick mock response for fast iteration testing.',
      finishReason: 'STOP',
      promptTokens: 20,
      completionTokens: 12
    },
    delay: 300,
    shouldSucceed: true
  },
  {
    id: 'failure-timeout',
    name: 'Timeout Error',
    description: 'Request timeout scenario to test error handling',
    response: {
      code: 'TIMEOUT',
      message: 'Request timeout - mock scenario for testing timeout handling',
      retryable: true
    },
    delay: 10000,
    shouldSucceed: false
  },
  {
    id: 'failure-rate-limit',
    name: 'Rate Limit Error',
    description: 'Rate limiting error to test throttling behavior',
    response: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded - mock scenario for testing API limits',
      retryable: true
    },
    delay: 800,
    shouldSucceed: false
  },
  {
    id: 'failure-auth',
    name: 'Authentication Error',
    description: 'Authentication failure to test security error handling',
    response: {
      code: 'AUTHENTICATION_FAILED',
      message: 'Authentication failed - mock scenario for testing auth errors',
      retryable: false
    },
    delay: 500,
    shouldSucceed: false
  }
];

/**
 * Mock scenarios manager for development testing
 */
export class MockScenarios {
  private scenarios: Map<string, MockScenario> = new Map();

  constructor() {
    // Load predefined scenarios
    PREDEFINED_SCENARIOS.forEach(scenario => {
      this.scenarios.set(scenario.id, scenario);
    });
  }

  /**
   * Get all available scenarios
   */
  getAllScenarios(): MockScenario[] {
    return Array.from(this.scenarios.values());
  }

  /**
   * Get scenario by ID
   */
  getScenario(id: string): MockScenario | null {
    return this.scenarios.get(id) || null;
  }

  /**
   * Add custom scenario
   */
  addScenario(scenario: MockScenario): void {
    this.scenarios.set(scenario.id, scenario);
  }

  /**
   * Remove scenario (only custom ones)
   */
  removeScenario(id: string): boolean {
    // Don't allow removal of predefined scenarios
    const isPredefined = PREDEFINED_SCENARIOS.some(s => s.id === id);
    if (isPredefined) {
      return false;
    }
    
    return this.scenarios.delete(id);
  }

  /**
   * Execute scenario with realistic delay simulation
   */
  async executeScenario(scenarioId: string): Promise<AIResponse> {
    const scenario = this.getScenario(scenarioId);
    if (!scenario) {
      throw new Error(`Mock scenario '${scenarioId}' not found`);
    }

    // Simulate realistic delay
    await new Promise(resolve => setTimeout(resolve, scenario.delay));

    if (scenario.shouldSucceed) {
      return scenario.response as AIResponse;
    } else {
      throw scenario.response as AIServiceError;
    }
  }

  /**
   * Get scenario with delay variation for more realistic testing
   */
  async executeScenarioWithVariation(scenarioId: string, variationPercent: number = 20): Promise<AIResponse> {
    const scenario = this.getScenario(scenarioId);
    if (!scenario) {
      throw new Error(`Mock scenario '${scenarioId}' not found`);
    }

    // Add delay variation (±variationPercent)
    const variation = scenario.delay * (variationPercent / 100);
    const actualDelay = scenario.delay + (Math.random() - 0.5) * 2 * variation;
    
    await new Promise(resolve => setTimeout(resolve, Math.max(0, actualDelay)));

    if (scenario.shouldSucceed) {
      return scenario.response as AIResponse;
    } else {
      throw scenario.response as AIServiceError;
    }
  }
}