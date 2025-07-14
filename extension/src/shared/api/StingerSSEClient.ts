/**
 * Stinger SSE Streaming Client
 */

import type { CheckResponse } from '../types/api';
import { API_CONFIG } from '../constants';
import { loggers } from '../logging/Logger';

const logger = loggers.content;

export interface SSEAnalysisResult {
  guardrailResults: GuardrailResult[];
  finalResponse?: CheckResponse;
  blocked: boolean;
  warnings: string[];
  reasons: string[];
}

export interface GuardrailResult {
  type: 'guardrail_result';
  guardrail_id: string;
  performance_class: 'FAST' | 'SLOW';
  result: {
    action: 'allow' | 'block' | 'warn';
    blocked: boolean;
    confidence: number;
    reason: string;
  };
  timestamp: string;
  processing_time_ms: number;
}

export interface SSEEvent {
  type: string;
  [key: string]: any;
}

export interface SSEConfig {
  baseUrl: string;
  timeout: number;
  headers?: Record<string, string>;
}

export class StingerSSEClient {
  private config: SSEConfig;
  private tabId: string = 'unknown';
  private sessionId: string;

  constructor(config: Partial<SSEConfig> = {}) {
    this.config = {
      baseUrl: process.env.STINGER_API_URL || 'http://localhost:8000',
      timeout: API_CONFIG.DEFAULT_TIMEOUT,
      ...config,
    };
    this.sessionId = this.generateSessionId();
  }

  /**
   * Analyze content with streaming SSE
   */
  async analyzeWithStreaming(text: string): Promise<SSEAnalysisResult> {
    try {
      // Validate input
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid text content');
      }

      if (text.length > API_CONFIG.MAX_TEXT_LENGTH) {
        throw new Error('Text content too large');
      }

      // Get tab ID if available
      await this.updateTabId();

      const url = `${this.config.baseUrl}/api/v1/stream/analyze`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          'X-Tab-ID': this.tabId,
          'X-Session-ID': this.sessionId,
          'X-Extension-Version': this.getExtensionVersion(),
          'X-User-Context': this.detectUserContext(),
          ...this.config.headers,
        },
        body: JSON.stringify({ content: text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported');
      }

      return await this.handleSSEStream(response.body);
    } catch (error) {
      throw new Error(
        `SSE analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Handle SSE stream parsing
   */
  private async handleSSEStream(body: ReadableStream<Uint8Array>): Promise<SSEAnalysisResult> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const result: SSEAnalysisResult = {
      guardrailResults: [],
      blocked: false,
      warnings: [],
      reasons: [],
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as SSEEvent;
              this.processSSEEvent(data, result);
            } catch (e) {
              // Re-throw stream_error events
              if (e instanceof Error && e.message.startsWith('Stream error:')) {
                throw e;
              }
              logger.warn('Failed to parse SSE data:', e);
            }
          }
        }
      }

      return result;
    } catch (error) {
      throw new Error(
        `Stream processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Process individual SSE events
   */
  private processSSEEvent(data: SSEEvent, result: SSEAnalysisResult): void {
    switch (data.type) {
      case 'guardrail_result': {
        const guardrailResult = data as GuardrailResult;
        result.guardrailResults.push(guardrailResult);

        // Update overall result based on guardrail outcome
        if (guardrailResult.result.blocked) {
          result.blocked = true;
          result.reasons.push(guardrailResult.result.reason);
        }
        if (guardrailResult.result.action === 'warn') {
          result.warnings.push(guardrailResult.result.reason);
        }
        break;
      }

      case 'input_blocked':
        result.blocked = true;
        if (data.reason) {
          result.reasons.push(data.reason);
        }
        break;

      case 'conversation_reset':
        // Handle conversation reset notification
        logger.info('Conversation reset:', data.message);
        break;

      case 'stream_error':
        throw new Error(`Stream error: ${data.error}`);

      case 'final_response':
        // Store final response if provided
        if (data.content) {
          result.finalResponse = {
            action: result.blocked ? 'block' : result.warnings.length > 0 ? 'warn' : 'allow',
            reasons: result.reasons,
            warnings: result.warnings,
            metadata: {
              guardrails_triggered: result.guardrailResults.map((g) => g.guardrail_id),
              processing_time_ms: result.guardrailResults.reduce(
                (sum, g) => sum + g.processing_time_ms,
                0,
              ),
            },
          };
        }
        break;

      case 'stream_complete':
        // Stream is complete
        break;

      default:
        // Unknown event type, log for debugging
        logger.debug(`Unknown SSE event: ${data.type}`);
    }
  }

  /**
   * Get current tab ID
   */
  private async updateTabId(): Promise<void> {
    try {
      // Try to get current tab ID in content script context
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        // We're in a Chrome extension context
        this.tabId = `tab-${Date.now()}`;
      } else {
        this.tabId = 'unknown';
      }
    } catch {
      this.tabId = 'unknown';
    }
  }

  /**
   * Get extension version
   */
  private getExtensionVersion(): string {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
        return chrome.runtime.getManifest().version;
      }
      return '0.1.0-a1';
    } catch {
      return '0.1.0-a1';
    }
  }

  /**
   * Detect user context from current page
   */
  private detectUserContext(): string {
    try {
      const hostname = window.location.hostname;
      if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) {
        return 'chatgpt';
      }
      if (hostname.includes('claude.ai')) {
        return 'claude';
      }
      if (hostname.includes('github.com')) {
        return 'github';
      }
      return 'general';
    } catch {
      return 'general';
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `session-${timestamp}-${random}`;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SSEConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if SSE is supported
   */
  static isSupported(): boolean {
    return typeof fetch !== 'undefined' && typeof ReadableStream !== 'undefined';
  }
}

// Default SSE client instance
export const stingerSSEClient = new StingerSSEClient();
