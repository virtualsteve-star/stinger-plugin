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

// Audit event for logging
export interface AuditEvent {
  id: string;
  timestamp: number;
  type: 'prompt' | 'response';
  action: 'allow' | 'warn' | 'block';
  text: string;
  hash: string;
  url: string;
  reasons?: string[];
  metadata?: Record<string, any>;
}

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
  auditQueue: AuditEvent[];
  cache: Record<string, CacheEntry>;
  lastSync: {
    rules: number;
    audit: number;
  };
}

// Storage keys enum for type safety
export enum StorageKeys {
  CONFIG = 'config',
  RULES = 'rules',
  AUDIT_QUEUE = 'auditQueue',
  CACHE = 'cache',
  LAST_SYNC = 'lastSync',
}

// Default values
export const DEFAULT_CONFIG: ExtensionConfig = {
  apiUrl: 'http://localhost:8888',
  apiTimeout: 2000,
  debugMode: false,
  logLevel: 'info',
};
