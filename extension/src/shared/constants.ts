/**
 * Application Constants
 */

// API Configuration
export const API_CONFIG = {
  DEFAULT_TIMEOUT: 2000,
  MAX_RETRIES: 1,
  MAX_TEXT_LENGTH: 50000,
  CACHE_TTL_MINUTES: 1,
} as const;

// UI Configuration
export const UI_CONFIG = {
  OVERLAY_Z_INDEX: 999999,
  BUTTON_CLICK_DELAY: 100,
  ELEMENT_CHECK_INTERVAL: 2000,
  DOM_READY_DELAY: 1000,
} as const;

// Storage Configuration
export const STORAGE_CONFIG = {
  CACHE_CLEANUP_THRESHOLD: 0.9,
  CACHE_MAX_SIZE: 100,
  DEFAULT_CACHE_TTL: 300000, // 5 minutes
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
  PROMPT_CHECK_TIMEOUT: 5000,
  MAX_CONCURRENT_CHECKS: 3,
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 30,
} as const;

// Chrome Extension Configuration
export const EXTENSION_CONFIG = {
  CONTENT_SCRIPT_READY_TIMEOUT: 10000,
  BACKGROUND_WORKER_PING_INTERVAL: 30000,
  RULES_SYNC_INTERVAL: 300000, // 5 minutes
} as const;