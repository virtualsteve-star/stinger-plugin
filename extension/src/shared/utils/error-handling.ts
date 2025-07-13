/**
 * Error Handling Utilities
 */

import { loggers } from '../logging/Logger';

const logger = loggers.background;

/**
 * Wrap a function to catch and log errors
 */
export function withErrorHandler<T extends (...args: any[]) => any>(fn: T, context: string): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);

      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          logger.error(`Error in ${context}`, error);
          throw error;
        });
      }

      return result;
    } catch (error) {
      logger.error(`Error in ${context}`, error);
      throw error;
    }
  }) as T;
}

/**
 * Wrap a function to catch errors and return a default value
 */
export function withErrorDefault<T extends (...args: any[]) => any>(
  fn: T,
  defaultValue: ReturnType<T>,
  context: string,
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);

      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          logger.error(`Error in ${context}, using default`, error);
          return defaultValue;
        });
      }

      return result;
    } catch (error) {
      logger.error(`Error in ${context}, using default`, error);
      return defaultValue;
    }
  }) as T;
}

/**
 * Create a safe wrapper for Chrome API callbacks
 */
export function safeCallback<T extends (...args: any[]) => void>(callback: T, context: string): T {
  return ((...args: Parameters<T>) => {
    try {
      callback(...args);
    } catch (error) {
      logger.error(`Callback error in ${context}`, error);
    }
  }) as T;
}

/**
 * Assert a condition and throw if false
 */
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    const error = new Error(`Assertion failed: ${message}`);
    logger.error('Assertion failed', error);
    throw error;
  }
}

/**
 * Type guard for Error objects
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Convert unknown error to Error object
 */
export function toError(error: unknown): Error {
  if (isError(error)) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String(error.message));
  }

  return new Error('Unknown error');
}

/**
 * Extract error message safely
 */
export function getErrorMessage(error: unknown): string {
  return toError(error).message;
}
