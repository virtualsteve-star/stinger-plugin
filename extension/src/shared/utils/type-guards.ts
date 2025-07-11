/**
 * Type Guards for Runtime Type Safety
 */

import type {
  ExtensionMessage,
  ContentLoadedMessage,
  CheckPromptMessage,
  CheckResponseMessage,
  CheckResultMessage,
  StatusUpdateMessage,
} from '../types/messages';

// Helper function to check base message structure
function isBaseMessage(
  obj: any,
): obj is { id: string; timestamp: number; type: string; payload: any } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.timestamp === 'number' &&
    typeof obj.type === 'string' &&
    obj.payload !== undefined
  );
}

// Content -> Background message guards
export function isContentLoadedMessage(msg: any): msg is ContentLoadedMessage {
  return (
    isBaseMessage(msg) &&
    msg.type === 'CONTENT_LOADED' &&
    typeof msg.payload === 'object' &&
    typeof msg.payload.url === 'string' &&
    typeof msg.payload.hostname === 'string'
  );
}

export function isCheckPromptMessage(msg: any): msg is CheckPromptMessage {
  return (
    isBaseMessage(msg) &&
    msg.type === 'CHECK_PROMPT' &&
    typeof msg.payload === 'object' &&
    typeof msg.payload.text === 'string'
  );
}

export function isCheckResponseMessage(msg: any): msg is CheckResponseMessage {
  return (
    isBaseMessage(msg) &&
    msg.type === 'CHECK_RESPONSE' &&
    typeof msg.payload === 'object' &&
    typeof msg.payload.text === 'string'
  );
}

// Background -> Content message guards
export function isCheckResultMessage(msg: any): msg is CheckResultMessage {
  return (
    isBaseMessage(msg) &&
    msg.type === 'CHECK_RESULT' &&
    typeof msg.payload === 'object' &&
    ['allow', 'warn', 'block'].includes(msg.payload.action) &&
    Array.isArray(msg.payload.reasons) &&
    Array.isArray(msg.payload.warnings) &&
    typeof msg.payload.originalMessageId === 'string'
  );
}

export function isStatusUpdateMessage(msg: any): msg is StatusUpdateMessage {
  return (
    isBaseMessage(msg) &&
    msg.type === 'STATUS_UPDATE' &&
    typeof msg.payload === 'object' &&
    typeof msg.payload.connected === 'boolean' &&
    typeof msg.payload.apiHealthy === 'boolean'
  );
}

// General extension message guard
export function isExtensionMessage(msg: any): msg is ExtensionMessage {
  return (
    isContentLoadedMessage(msg) ||
    isCheckPromptMessage(msg) ||
    isCheckResponseMessage(msg) ||
    isCheckResultMessage(msg) ||
    isStatusUpdateMessage(msg)
  );
}

// Utility to validate and narrow message types
export function validateMessage<T extends ExtensionMessage>(
  msg: any,
  guard: (msg: any) => msg is T,
): T {
  if (!guard(msg)) {
    throw new Error(`Invalid message format: ${JSON.stringify(msg)}`);
  }
  return msg;
}
