/**
 * Logger utility for standardized debug logging across the application.
 * Provides severity levels, environment-based toggling, and formatted output.
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

interface LogColors {
  [key: string]: string;
}

const LOG_COLORS: LogColors = {
  [LogLevel.DEBUG]: 'color: #888; font-weight: normal;',
  [LogLevel.INFO]: 'color: #2196F3; font-weight: normal;',
  [LogLevel.WARN]: 'color: #FF9800; font-weight: bold;',
  [LogLevel.ERROR]: 'color: #F44336; font-weight: bold;'
};

export class Logger {
  private context: string;
  public isEnabled: boolean;

  constructor(context: string) {
    this.context = context;
    // Check if logging is enabled via environment variable
    // Logging is disabled in production regardless of the env variable
    this.isEnabled = process.env.NODE_ENV !== 'production' && 
                    process.env.NEXT_PUBLIC_DEBUG_LOGGING === 'true';
  }

  /**
   * Formats the timestamp for log messages
   */
  private formatTimestamp(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  /**
   * Formats the log prefix with timestamp and context
   */
  private formatPrefix(level: LogLevel): string {
    const timestamp = this.formatTimestamp();
    const levelStr = level.toUpperCase().padEnd(5);
    return `[${timestamp}] ${levelStr} [${this.context}]`;
  }

  /**
   * Logs a message with the specified level
   */
  private log(level: LogLevel, ...args: unknown[]): void {
    if (!this.isEnabled) return;

    const prefix = this.formatPrefix(level);
    const color = LOG_COLORS[level];
    
    // Apply color formatting for browser console
    const formattedPrefix = `%c${prefix}`;
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedPrefix, color, ...args);
        break;
      case LogLevel.INFO:
        console.log(formattedPrefix, color, ...args);
        break;
      case LogLevel.WARN:
        console.warn(formattedPrefix, color, ...args);
        break;
      case LogLevel.ERROR:
        console.error(formattedPrefix, color, ...args);
        break;
    }
  }

  /**
   * Logs a debug message
   */
  debug(...args: unknown[]): void {
    this.log(LogLevel.DEBUG, ...args);
  }

  /**
   * Logs an info message
   */
  info(...args: unknown[]): void {
    this.log(LogLevel.INFO, ...args);
  }

  /**
   * Logs a warning message
   */
  warn(...args: unknown[]): void {
    this.log(LogLevel.WARN, ...args);
  }

  /**
   * Logs an error message
   */
  error(...args: unknown[]): void {
    this.log(LogLevel.ERROR, ...args);
  }
}

// Default export for convenience
export default Logger;

// Create a default logger instance
export const logger = new Logger('Narraitor');
