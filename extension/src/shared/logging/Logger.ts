/**
 * Logging System for Stinger Extension
 */

import type { ExtensionConfig } from '../types/storage';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: any;
  source: string;
}

export class Logger {
  private static instance: Logger;
  private config?: ExtensionConfig;
  private readonly logBuffer: LogEntry[] = [];
  private readonly MAX_BUFFER_SIZE = 100;
  private readonly SOURCE_PREFIX = 'Stinger Guard';

  private constructor(private readonly source: string) {}

  /**
   * Create a logger instance for a specific module
   */
  static create(source: string): Logger {
    return new Logger(source);
  }

  /**
   * Get the default logger instance
   */
  static get default(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger('default');
    }
    return Logger.instance;
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: any): void {
    this.log('debug', message, context);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: any): void {
    this.log('info', message, context);
  }

  /**
   * Log a warning
   */
  warn(message: string, context?: any): void {
    this.log('warn', message, context);
  }

  /**
   * Log an error
   */
  error(message: string, error?: Error | any): void {
    const context =
      error instanceof Error
        ? {
            error: error.message,
            stack: error.stack,
            ...error,
          }
        : error;

    this.log('error', message, context);
  }

  /**
   * Core logging function
   */
  private async log(level: LogLevel, message: string, context?: any): Promise<void> {
    // For MVP, we'll use environment config
    // In production, this would load from storage

    // Check if we should log this level
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context,
      source: this.source,
    };

    // Add to buffer
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
      this.logBuffer.shift();
    }

    // Format and output
    const formattedMessage = this.formatMessage(entry);

    switch (level) {
      case 'debug':
        console.debug(formattedMessage, context);
        break;
      case 'info':
        console.info(formattedMessage, context);
        break;
      case 'warn':
        console.warn(formattedMessage, context);
        break;
      case 'error':
        console.error(formattedMessage, context);
        break;
    }

    // Store errors for later reporting
    if (level === 'error') {
      this.storeError(entry).catch(() => {
        // Ignore storage errors to prevent infinite loops
      });
    }
  }

  /**
   * Check if we should log this level
   */
  private shouldLog(level: LogLevel): boolean {
    const logLevel = this.config?.logLevel || 'info';
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const configLevelIndex = levels.indexOf(logLevel);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= configLevelIndex;
  }

  /**
   * Format log message
   */
  private formatMessage(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    return `[${timestamp}] ${this.SOURCE_PREFIX}:${entry.source} ${level} ${entry.message}`;
  }

  /**
   * Store error for later reporting
   */
  private async storeError(_entry: LogEntry): Promise<void> {
    // TODO: In production, this should send to error tracking service
    // For MVP, we just log to console
    // Audit events are only for prompt/response checks, not errors
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  /**
   * Clear log buffer
   */
  clearLogs(): void {
    this.logBuffer.length = 0;
  }

  /**
   * Export logs for debugging
   */
  exportLogs(): string {
    return this.logBuffer
      .map(
        (entry) =>
          this.formatMessage(entry) +
          (entry.context ? '\n  Context: ' + JSON.stringify(entry.context, null, 2) : ''),
      )
      .join('\n');
  }
}

// Create module-specific loggers
export const loggers = {
  content: Logger.create('content'),
  background: Logger.create('background'),
  api: Logger.create('api'),
  storage: Logger.create('storage'),
  messaging: Logger.create('messaging'),
};
