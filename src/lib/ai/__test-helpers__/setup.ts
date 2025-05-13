// src/lib/ai/__test-helpers__/setup.ts

import { PromptTemplateManager } from '../../promptTemplates/promptTemplateManager';
import { PromptType } from '../../promptTemplates/types';
import { AIConfig } from '../types';

/**
 * Creates a mock template manager with test templates
 * @returns Configured template manager
 */
export const createMockTemplateManager = (): PromptTemplateManager => {
  const manager = new PromptTemplateManager();
  
  // Add common test templates
  manager.addTemplate({
    id: 'narrative-test',
    type: PromptType.NARRATIVE,
    content: 'Test narrative for {{character}}',
    variables: [{ name: 'character', description: 'Character name' }]
  });
  
  manager.addTemplate({
    id: 'dialogue-test',
    type: PromptType.DIALOGUE,
    content: 'Dialogue between {{speaker1}} and {{speaker2}}',
    variables: [
      { name: 'speaker1', description: 'First speaker' },
      { name: 'speaker2', description: 'Second speaker' }
    ]
  });
  
  return manager;
};

/**
 * Creates a test configuration
 * @param overrides - Properties to override defaults
 * @returns Test configuration
 */
export const createTestConfig = (overrides = {}): AIConfig => ({
  geminiApiKey: 'test-api-key',
  modelName: 'gemini-1.5-flash-latest',
  maxRetries: 3,
  timeout: 30000,
  ...overrides
});
