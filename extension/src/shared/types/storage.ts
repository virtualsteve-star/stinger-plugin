/**
 * Storage Schema Types for Chrome Extension Storage
 */

// Configuration stored in Chrome storage
export interface ExtensionConfig {
  apiUrl: string;
  apiTimeout: number;
  debugMode: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  tenantId?: string;
  userId?: string;
  userName?: string;
}

// Cached policy rules
export interface PolicyRules {
  version: string;
  preset: string;
  guardrails: {
    input_guardrails: Record<string, any>;
    output_guardrails: Record<string, any>;
  };
  lastUpdated: number;
}

// Note: Audit events are NOT stored locally
// All audit logging is handled by the Stinger backend

// Response cache entry
export interface CacheEntry {
  key: string;
  value: any;
  expires: number;
}

// Complete storage schema
export interface StorageSchema {
  config: ExtensionConfig;
  rules?: PolicyRules;
  cache: Record<string, CacheEntry>;
  lastSync: {
    rules: number;
    // Note: No audit sync - auditing is backend-only
  };
}

// Storage keys enum for type safety
export enum StorageKeys {
  CONFIG = 'config',
  RULES = 'rules',
  CACHE = 'cache',
  LAST_SYNC = 'lastSync',
}

// Default values
export const DEFAULT_CONFIG: ExtensionConfig = {
  apiUrl: 'http://localhost:8100',
  apiTimeout: 15000, // 15 seconds - increased for guardrail processing time
  debugMode: false,
  logLevel: 'info',
};
