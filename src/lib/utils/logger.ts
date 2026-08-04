/* eslint-disable no-console -- this module is the console wrapper */
/**
 * Logger utility for standardized debug logging across the application.
 * Provides severity levels, environment-based toggling, and formatted output.
 */
import { reportError } from '@/lib/telemetry/reportError';
import { selectReportableError } from '@/lib/telemetry/errorReport';

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

const LOG_LEVEL_NAMES: { [key: number]: string } = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.NONE]: 'NONE'
};

interface LogColors {
  [key: string]: string;
}

// Browser-console styling only — not app UI, so these stay literal hex
// rather than design-system tokens (CSS custom properties can't reach
// console.log %c styles).
const LOG_COLORS: LogColors = {
  [LogLevel.DEBUG]: 'color: #71717a; font-weight: normal;',
  [LogLevel.INFO]: 'color: #3b82f6; font-weight: normal;',
  [LogLevel.WARN]: 'color: #f59e0b; font-weight: bold;',
  [LogLevel.ERROR]: 'color: #ef4444; font-weight: bold;',
  [LogLevel.NONE]: ''
};

/**
 * Parse log level from environment variable
 */
function parseLogLevel(level?: string, fallback: LogLevel = LogLevel.WARN): LogLevel {
  const upperLevel = level?.toUpperCase();
  switch (upperLevel) {
    case 'DEBUG': return LogLevel.DEBUG;
    case 'INFO': return LogLevel.INFO;
    case 'WARN': return LogLevel.WARN;
    case 'ERROR': return LogLevel.ERROR;
    case 'NONE': return LogLevel.NONE;
    default: return fallback;
  }
}

class Logger {
  private context: string;
  public isEnabled: boolean;
  private minLevel: LogLevel;

  constructor(context: string) {
    this.context = context;

    // Determine if logging is enabled and at what level
    if (process.env.NODE_ENV === 'production') {
      // Production: only errors unless explicitly configured
      this.isEnabled = true;
      this.minLevel = parseLogLevel(process.env.NEXT_PUBLIC_LOG_LEVEL, LogLevel.ERROR);
    } else {
      // Development: check legacy flag first, then use log level
      if (process.env.NEXT_PUBLIC_DEBUG_LOGGING === 'false') {
        this.isEnabled = false;
        this.minLevel = LogLevel.NONE;
      } else {
        this.isEnabled = true;
        this.minLevel = parseLogLevel(process.env.NEXT_PUBLIC_LOG_LEVEL);
      }
    }
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
    const levelStr = LOG_LEVEL_NAMES[level].padEnd(5);
    return `[${timestamp}] ${levelStr} [${this.context}]`;
  }

  /**
   * Logs a message with the specified level
   */
  private log(level: LogLevel, ...args: unknown[]): void {
    if (!this.isEnabled) return;
    if (level < this.minLevel) return; // Skip logs below minimum level

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
   * Logs an error message, and in production forwards it to the error sink.
   *
   * Every logger.error call site in the app funnels through here, which is why
   * this is the one hook the client needs (#1641). The report is built from the
   * Error among the arguments, not from args[0] — the first argument is usually
   * a label string, and reporting it would ship a stack-less report.
   */
  error(...args: unknown[]): void {
    this.log(LogLevel.ERROR, ...args);

    try {
      reportError(selectReportableError(args), { source: 'client' });
    } catch {
      // Reporting must never take out logging. Telemetry deliberately does not
      // import this module, so there is no cycle to trip over here either.
    }
  }
}

// Default export for convenience
export default Logger;

// Create a default logger instance
export const logger = new Logger('Narraitor');
