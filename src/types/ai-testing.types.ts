import type { World, Character, NarrativeContext } from './index';

// AI Testing Configuration
export interface AITestConfig {
  worldOverride?: Partial<World>;
  characterOverride?: Partial<Character>;
  narrativeContext?: Partial<NarrativeContext>;
  templateId?: string;
  customVariables?: Record<string, string>;
  expectedOutput?: string;
}

// Request/Response Logging
export interface AIRequestLog {
  id: string;
  timestamp: Date;
  templateId: string;
  promptSent: string;
  contextUsed: NarrativeContext;
  response?: AIResponse;
  tokenUsage?: TokenUsage;
  responseTime?: number;
  testConfig?: AITestConfig;
}

// AI Response format
export interface AIResponse {
  text: string;
  choices?: string[];
  metadata?: Record<string, any>;
}

// Token usage tracking
export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

// Test Scenario Management
export interface TestScenario {
  id: string;
  name: string;
  description: string;
  config: AITestConfig;
  expectedOutput?: string;
  lastRun?: Date;
  lastResult?: AIRequestLog;
}