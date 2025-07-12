/**
 * Stinger API Client
 */

import type {
  CheckRequest,
  CheckResponse,
  RulesResponse,
  HealthResponse,
  ApiResult,
} from '../types/api';
import { retry } from '../utils/helpers';
import { storageService } from '../storage/StorageService';

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  maxRetries?: number;
  headers?: Record<string, string>;
}

export class StingerClient {
  private config: ApiConfig;
  private abortController?: AbortController;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      baseUrl: 'http://localhost:8888',
      timeout: 2000,
      maxRetries: 1,
      ...config,
    };
  }

  /**
   * Check content against guardrails
   */
  async checkContent(request: CheckRequest): Promise<ApiResult<CheckResponse>> {
    try {
      // Check cache first for identical requests
      const cacheKey = `check:${JSON.stringify(request)}`;
      const cached = await storageService.getCached<CheckResponse>(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }

      const response = await this.request<CheckResponse>('/v1/check', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      // Cache successful responses for 1 minute
      if (response.success) {
        await storageService.setCached(cacheKey, response.data, 60000);
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CHECK_ERROR',
          message: error instanceof Error ? error.message : 'Check failed',
        },
      };
    }
  }

  /**
   * Get current guardrail rules
   */
  async getRules(): Promise<ApiResult<RulesResponse>> {
    try {
      // Check cache first
      const cached = await storageService.getCached<RulesResponse>('rules');
      if (cached) {
        return { success: true, data: cached };
      }

      const response = await this.request<RulesResponse>('/v1/rules');

      // Cache rules for 5 minutes
      if (response.success) {
        await storageService.setCached('rules', response.data, 300000);

        // Also update persistent storage
        await storageService.updateRules(response.data);
      }

      return response;
    } catch (error) {
      // Fall back to stored rules if available
      const storedRules = await storageService.getRules();
      if (storedRules) {
        return { success: true, data: storedRules };
      }

      return {
        success: false,
        error: {
          code: 'RULES_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get rules',
        },
      };
    }
  }

  /**
   * Check API health
   */
  async health(): Promise<ApiResult<HealthResponse>> {
    try {
      const response = await this.request<HealthResponse>('/health', {
        maxRetries: 0, // Don't retry health checks
      });
      return response;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HEALTH_ERROR',
          message: error instanceof Error ? error.message : 'Health check failed',
        },
      };
    }
  }

  /**
   * Make a request with timeout and retry logic
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit & { maxRetries?: number } = {},
  ): Promise<ApiResult<T>> {
    const { maxRetries = this.config.maxRetries, ...fetchOptions } = options;

    const makeRequest = async (): Promise<T> => {
      // Create new abort controller for each request
      this.abortController = new AbortController();
      const timeoutId = setTimeout(() => this.abortController?.abort(), this.config.timeout);

      try {
        const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
          ...fetchOptions,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...this.config.headers,
            ...fetchOptions.headers,
          },
          signal: this.abortController.signal,
        });

        if (!response) {
          throw new Error('Fetch returned undefined response');
        }

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Check content type - we expect JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          // For detached mode (202), empty response is OK
          if (response.status === 202) {
            return undefined as T;
          }
          // Otherwise, we expected JSON
          throw new Error(`Expected JSON response, got ${contentType || 'unknown'}`);
        }

        const text = await response.text();
        if (!text) {
          throw new Error('Empty response body');
        }

        return JSON.parse(text);
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.config.timeout}ms`);
        }

        throw error;
      }
    };

    try {
      const data = await retry(makeRequest, {
        maxAttempts: maxRetries! + 1,
        initialDelay: 500,
        maxDelay: 2000,
      });

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REQUEST_ERROR',
          message: error instanceof Error ? error.message : 'Request failed',
        },
      };
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Cancel any pending requests
   */
  cancelRequests(): void {
    this.abortController?.abort();
  }
}

// Default client instance
export const stingerClient = new StingerClient();
