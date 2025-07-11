/**
 * Message Protocol Types for Content Script <-> Background Communication
 */

// Base message structure
export interface BaseMessage {
  id: string;
  timestamp: number;
}

// Content -> Background messages
export interface ContentLoadedMessage extends BaseMessage {
  type: 'CONTENT_LOADED';
  payload: {
    url: string;
    hostname: string;
  };
}

export interface CheckPromptMessage extends BaseMessage {
  type: 'CHECK_PROMPT';
  payload: {
    text: string;
    metadata?: {
      conversationId?: string;
      messageId?: string;
    };
  };
}

export interface CheckResponseMessage extends BaseMessage {
  type: 'CHECK_RESPONSE';
  payload: {
    text: string;
    metadata?: {
      conversationId?: string;
      messageId?: string;
      model?: string;
    };
  };
}

// Background -> Content messages
export interface CheckResultMessage extends BaseMessage {
  type: 'CHECK_RESULT';
  payload: {
    action: 'allow' | 'warn' | 'block';
    reasons: string[];
    warnings: string[];
    originalMessageId: string;
  };
}

export interface StatusUpdateMessage extends BaseMessage {
  type: 'STATUS_UPDATE';
  payload: {
    connected: boolean;
    apiHealthy: boolean;
    rulesVersion?: string;
  };
}

// Union types for all messages
export type ContentToBackgroundMessage =
  | ContentLoadedMessage
  | CheckPromptMessage
  | CheckResponseMessage;

export type BackgroundToContentMessage = CheckResultMessage | StatusUpdateMessage;

export type ExtensionMessage = ContentToBackgroundMessage | BackgroundToContentMessage;

// Message response types
export interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
