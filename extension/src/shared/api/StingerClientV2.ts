/**
 * Stinger API Client V2 - Phase 15 Production API
 */

import type { CheckResponse } from '../types/api';
import { loggers } from '../logging/Logger';

const logger = loggers.api;

export interface Phase15Request {
  text: string;
  kind: 'prompt' | 'response';
  mode?: 'default' | 'streaming' | 'streaming_final' | 'monitor';
  preset?: string;
  context?: {
    conversation_id?: string;
    userId?: string;
    sessionId?: string;
  };
}

export interface Phase15Response {
  action: 'allow' | 'block' | 'warn';
  reasons: string[];
  warnings: string[];
  metadata: {
    guardrails_triggered: string[];
    processing_time_ms: number;
  };
}

export class StingerClientV2 {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = 'http://localhost:8100', timeout: number = 5000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Check content with Stinger guardrails
   */
  async check(request: Phase15Request): Promise<Phase15Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/v1/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result: Phase15Response = await response.json();

      logger.debug('Guardrail check result:', {
        action: result.action,
        mode: request.mode,
        guardrails: result.metadata.guardrails_triggered,
        time: result.metadata.processing_time_ms,
      });

      return result;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          logger.warn('API request timed out, failing open');
        } else if (error.message.includes('Extension context invalidated')) {
          logger.warn('Extension context invalidated, failing open');
        } else {
          logger.error('API error:', error);
        }
      }

      // Fail open for availability
      return {
        action: 'allow',
        reasons: [],
        warnings: ['Security check unavailable'],
        metadata: {
          guardrails_triggered: [],
          processing_time_ms: 0,
        },
      };
    }
  }

  /**
   * Check user input (prompt) with full protection
   */
  async checkInput(text: string, conversationId?: string): Promise<CheckResponse> {
    const result = await this.check({
      text,
      kind: 'prompt',
      mode: 'default', // Full protection for user input
      preset: 'demo_showcase',
      context: conversationId
        ? {
            conversation_id: conversationId,
          }
        : undefined,
    });

    return this.convertToCheckResponse(result);
  }

  /**
   * Check LLM output with streaming_final mode
   */
  async checkOutput(text: string, conversationId?: string): Promise<CheckResponse> {
    const result = await this.check({
      text,
      kind: 'response',
      mode: 'streaming_final', // Full check on complete response
      preset: 'demo_showcase',
      context: conversationId
        ? {
            conversation_id: conversationId,
          }
        : undefined,
    });

    return this.convertToCheckResponse(result);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(2000),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.status === 'healthy';
    } catch {
      return false;
    }
  }

  /**
   * Convert Phase 15 response to legacy CheckResponse format
   */
  private convertToCheckResponse(result: Phase15Response): CheckResponse {
    return {
      action: result.action,
      reasons: result.reasons,
      warnings: result.warnings,
      metadata: {
        guardrails_triggered: result.metadata.guardrails_triggered,
        processing_time_ms: result.metadata.processing_time_ms,
      },
    };
  }
}

// Singleton instance
export const stingerClientV2 = new StingerClientV2();
