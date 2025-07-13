/**
 * API Types for Stinger Integration
 */

// Conversation tracking context
export type ParticipantType = 'human' | 'bot' | 'agent' | 'ai_model';

export interface ConversationContext {
  // Required for tracking
  userId: string;
  botId: string;

  // Participant types (default to human <-> ai_model)
  userType?: ParticipantType;
  botType?: ParticipantType;

  // Optional but recommended
  userName?: string;
  botName?: string;
  botModel?: string;
  sessionId?: string;

  // Additional context
  browser?: string;
  extensionVersion?: string;
  url?: string;
  [key: string]: unknown;
}

// Request types matching Stinger API
export interface CheckRequest {
  text: string;
  tenantId?: string;
  userId?: string;
  kind?: 'prompt' | 'response';
  detached?: boolean;
  context?: ConversationContext;
}

export interface CheckResponse {
  action: 'allow' | 'warn' | 'block';
  reasons: string[];
  warnings: string[];
  metadata: {
    guardrails_triggered: string[];
    processing_time_ms: number;
  };
}

export interface RulesResponse {
  preset: string;
  guardrails: {
    input_guardrails: Record<string, any>;
    output_guardrails: Record<string, any>;
  };
  version: string;
}

export interface HealthResponse {
  status: string;
  pipeline_available: boolean;
  guardrail_count: number;
  api_key_configured: boolean;
}

// API Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export type ApiResult<T> = { success: true; data: T } | { success: false; error: ApiError };
