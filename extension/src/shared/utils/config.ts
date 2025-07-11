/**
 * Configuration utilities
 */

import type { ExtensionConfig } from '../types/storage';

/**
 * Get configuration with environment variable overrides
 */
export function getEnvironmentConfig(): Partial<ExtensionConfig> {
  // Only use import.meta.env in non-test environments
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return {
      apiUrl: import.meta.env.VITE_STINGER_API_URL || undefined,
      apiTimeout: import.meta.env.VITE_API_TIMEOUT
        ? parseInt(import.meta.env.VITE_API_TIMEOUT)
        : undefined,
      debugMode: import.meta.env.VITE_DEBUG_MODE === 'true' || undefined,
      logLevel: (import.meta.env.VITE_LOG_LEVEL as ExtensionConfig['logLevel']) || undefined,
    };
  }

  return {};
}

/**
 * Merge environment config with defaults
 */
export function mergeWithEnvironment(config: ExtensionConfig): ExtensionConfig {
  const envConfig = getEnvironmentConfig();
  return {
    ...config,
    ...Object.fromEntries(Object.entries(envConfig).filter(([_, v]) => v !== undefined)),
  };
}