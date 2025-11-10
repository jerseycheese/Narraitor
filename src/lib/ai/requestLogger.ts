import type { NarrativeContext, AITestConfig, AIRequestLog, AIResponse } from '../../types';
import { generateUniqueId } from '../utils/generateId';

/**
 * Simple AI request logging using a module-level Map.
 * Simplified from an overengineered singleton class pattern.
 */

const logs = new Map<string, AIRequestLog>();

export function startRequest(
  templateId: string,
  promptSent: string,
  contextUsed: NarrativeContext,
  testConfig?: AITestConfig
): string {
  const logId = generateUniqueId('log');
  const log: AIRequestLog = {
    id: logId,
    timestamp: new Date(),
    templateId,
    promptSent,
    contextUsed,
    testConfig
  };

  logs.set(logId, log);
  return logId;
}

export function completeRequest(
  logId: string,
  response: AIResponse,
  responseTime: number
): void {
  const log = logs.get(logId);
  if (!log) return;

  log.response = response;
  log.responseTime = responseTime;

  // Extract token usage if available
  if (response.metadata?.tokens && typeof response.metadata.tokens === 'object') {
    const tokens = response.metadata.tokens as Record<string, unknown>;
    if (
      typeof tokens.prompt === 'number' &&
      typeof tokens.completion === 'number' &&
      typeof tokens.total === 'number'
    ) {
      log.tokenUsage = tokens as { prompt: number; completion: number; total: number };
    }
  }
}

export function getLogs(): AIRequestLog[] {
  return Array.from(logs.values())
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function getLogsByTemplate(templateId: string): AIRequestLog[] {
  return getLogs().filter(log => log.templateId === templateId);
}

export function clearLogs(): void {
  logs.clear();
}

export function getLog(logId: string): AIRequestLog | undefined {
  return logs.get(logId);
}

export type { AIRequestLog };
