import type { NarrativeContext, AITestConfig, AIRequestLog, AIResponse } from '../../types';
import { generateId } from '../utils/generateId';

/**
 * Logs AI requests and responses for debugging and testing purposes
 */
export class RequestLogger {
  private logs: Map<string, AIRequestLog> = new Map();
  
  /**
   * Starts a new request log entry
   */
  startRequest(
    templateId: string,
    promptSent: string,
    contextUsed: NarrativeContext,
    testConfig?: AITestConfig
  ): string {
    const logId = generateId();
    const log: AIRequestLog = {
      id: logId,
      timestamp: new Date(),
      templateId,
      promptSent,
      contextUsed,
      testConfig
    };
    
    this.logs.set(logId, log);
    return logId;
  }
  
  /**
   * Completes a request log with response data
   */
  completeRequest(
    logId: string,
    response: AIResponse,
    responseTime: number
  ): void {
    const log = this.logs.get(logId);
    if (log) {
      log.response = response;
      log.responseTime = responseTime;
      
      // Extract token usage if available in metadata
      if (response.metadata?.tokens) {
        log.tokenUsage = response.metadata.tokens;
      }
    }
  }
  
  /**
   * Gets all logs in reverse chronological order (most recent first)
   */
  getLogs(): AIRequestLog[] {
    return Array.from(this.logs.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  /**
   * Gets logs filtered by template ID
   */
  getLogsByTemplate(templateId: string): AIRequestLog[] {
    return this.getLogs().filter(log => log.templateId === templateId);
  }
  
  /**
   * Clears all logs
   */
  clearLogs(): void {
    this.logs.clear();
  }
  
  /**
   * Gets a specific log by ID
   */
  getLog(logId: string): AIRequestLog | undefined {
    return this.logs.get(logId);
  }
}

// Export a singleton instance for use throughout the application
export const requestLogger = new RequestLogger();

// Export the type for external use
export type { AIRequestLog };