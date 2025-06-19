import { RequestLogger } from '../requestLogger';
import type { NarrativeContext, AITestConfig } from '../../../types';

describe('RequestLogger', () => {
  let logger: RequestLogger;

  beforeEach(() => {
    logger = new RequestLogger();
  });

  test('logs AI request with all required information', () => {
    const mockContext: NarrativeContext = {
      recentSegments: [],
      activeCharacters: ['char-1'],
      currentLocation: 'Test area',
      activeQuests: [],
      mood: 'neutral'
    };

    const mockTestConfig: AITestConfig = {
      worldOverride: { name: 'Test World' }
    };

    const logId = logger.startRequest('test-template', 'Test prompt content', mockContext, mockTestConfig);

    expect(typeof logId).toBe('string');
    expect(logId.length).toBeGreaterThan(0);
  });

  test('completes request log with response data', () => {
    const mockContext: NarrativeContext = {
      recentSegments: [],
      activeCharacters: ['char-1'],
      currentLocation: 'Test area',
      activeQuests: [],
      mood: 'neutral'
    };

    const logId = logger.startRequest('test-template', 'Test prompt', mockContext);
    
    const mockResponse = {
      text: 'Generated narrative',
      choices: ['Choice 1', 'Choice 2'],
      metadata: { tokens: 150 }
    };

    logger.completeRequest(logId, mockResponse, 1250);

    const logs = logger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].response).toEqual(mockResponse);
    expect(logs[0].responseTime).toBe(1250);
  });


  test('filters logs by template ID', () => {
    const mockContext: NarrativeContext = {
      recentSegments: [],
      activeCharacters: ['char-1'],
      currentLocation: 'Test area',
      activeQuests: [],
      mood: 'neutral'
    };

    logger.startRequest('scene-template', 'Scene prompt', mockContext);
    logger.startRequest('choice-template', 'Choice prompt', mockContext);
    logger.startRequest('scene-template', 'Another scene prompt', mockContext);

    const sceneLogs = logger.getLogsByTemplate('scene-template');
    expect(sceneLogs).toHaveLength(2);
    expect(sceneLogs.every(log => log.templateId === 'scene-template')).toBe(true);
  });

  test('clears all logs', () => {
    const mockContext: NarrativeContext = {
      recentSegments: [],
      activeCharacters: ['char-1'],
      currentLocation: 'Test area',
      activeQuests: [],
      mood: 'neutral'
    };

    logger.startRequest('template-1', 'Prompt 1', mockContext);
    logger.startRequest('template-2', 'Prompt 2', mockContext);

    expect(logger.getLogs()).toHaveLength(2);

    logger.clearLogs();
    expect(logger.getLogs()).toHaveLength(0);
  });

  test('handles incomplete requests gracefully', () => {
    const mockContext: NarrativeContext = {
      recentSegments: [],
      activeCharacters: ['char-1'],
      currentLocation: 'Test area',
      activeQuests: [],
      mood: 'neutral'
    };

    logger.startRequest('test-template', 'Test prompt', mockContext);
    
    // Don't complete the request
    const logs = logger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].response).toBeUndefined();
    expect(logs[0].responseTime).toBeUndefined();
  });
});
