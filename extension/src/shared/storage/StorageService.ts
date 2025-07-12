/**
 * Storage Service - Abstraction layer for Chrome extension storage
 */

import { ChromeWrapper } from '../chrome/ChromeWrapper';
import type { StorageSchema, ExtensionConfig, PolicyRules } from '../types/storage';
import { DEFAULT_CONFIG } from '../types/storage';

export interface IStorageService {
  get<K extends keyof StorageSchema>(key: K): Promise<StorageSchema[K] | undefined>;
  set<K extends keyof StorageSchema>(key: K, value: StorageSchema[K]): Promise<void>;
  remove<K extends keyof StorageSchema>(key: K): Promise<void>;
  clear(): Promise<void>;
  getBytesInUse(): Promise<number>;
}

export class StorageService implements IStorageService {
  private readonly MAX_STORAGE_BYTES = 5 * 1024 * 1024; // 5MB Chrome limit
  private readonly CACHE_CLEANUP_THRESHOLD = 0.9; // Clean up when 90% full
  private isInternalOperation = false;

  /**
   * Get a value from storage
   */
  async get<K extends keyof StorageSchema>(key: K): Promise<StorageSchema[K] | undefined> {
    try {
      const result = await ChromeWrapper.storage.get<Record<string, any>>(key as string);

      // Apply defaults for config
      if (key === 'config' && !result[key]) {
        return DEFAULT_CONFIG as StorageSchema[K];
      }

      return result[key] as StorageSchema[K] | undefined;
    } catch (error) {
      console.error('Storage get error:', error);
      return undefined;
    }
  }

  /**
   * Set a value in storage
   */
  async set<K extends keyof StorageSchema>(key: K, value: StorageSchema[K]): Promise<void> {
    try {
      // Check storage quota before writing (skip for internal operations)
      if (!this.isInternalOperation) {
        await this.checkStorageQuota();
      }

      await ChromeWrapper.storage.set({ [key]: value });
    } catch (error) {
      console.error('Storage set error:', error);
      throw error;
    }
  }

  /**
   * Remove a key from storage
   */
  async remove<K extends keyof StorageSchema>(key: K): Promise<void> {
    await ChromeWrapper.storage.remove(key as string);
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    await ChromeWrapper.storage.clear();
  }

  /**
   * Get bytes in use
   */
  async getBytesInUse(): Promise<number> {
    return ChromeWrapper.storage.getBytesInUse();
  }

  /**
   * Get configuration with defaults
   */
  async getConfig(): Promise<ExtensionConfig> {
    try {
      const config = await this.get('config');
      return { ...DEFAULT_CONFIG, ...config };
    } catch (error) {
      console.error('Error getting config:', error);
      return DEFAULT_CONFIG;
    }
  }

  /**
   * Update configuration
   */
  async updateConfig(updates: Partial<ExtensionConfig>): Promise<void> {
    const current = await this.getConfig();
    await this.set('config', { ...current, ...updates });
  }

  /**
   * Get cached rules
   */
  async getRules(): Promise<PolicyRules | undefined> {
    return this.get('rules');
  }

  /**
   * Update rules with timestamp
   */
  async updateRules(rules: Omit<PolicyRules, 'lastUpdated'>): Promise<void> {
    await this.set('rules', {
      ...rules,
      lastUpdated: Date.now(),
    });
  }



  /**
   * Cache operations
   */
  async getCached<T>(key: string): Promise<T | undefined> {
    const cache = (await this.get('cache')) || {};
    const entry = cache[key];

    if (!entry || entry.expires < Date.now()) {
      // Remove expired entry
      if (entry) {
        delete cache[key];
        await this.set('cache', cache);
      }
      return undefined;
    }

    return entry.value as T;
  }

  async setCached<T>(key: string, value: T, ttl: number = 300000): Promise<void> {
    const cache = (await this.get('cache')) || {};

    cache[key] = {
      key,
      value,
      expires: Date.now() + ttl,
    };

    await this.set('cache', cache);
  }

  async clearCache(): Promise<void> {
    this.isInternalOperation = true;
    try {
      await this.set('cache', {});
    } finally {
      this.isInternalOperation = false;
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupCache(): Promise<void> {
    const cache = (await this.get('cache')) || {};
    const now = Date.now();
    let hasChanges = false;

    for (const key in cache) {
      if (cache[key].expires < now) {
        delete cache[key];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await this.set('cache', cache);
    }
  }

  /**
   * Check storage quota and clean up if needed
   */
  private async checkStorageQuota(): Promise<void> {
    const bytesInUse = await this.getBytesInUse();
    const threshold = this.MAX_STORAGE_BYTES * this.CACHE_CLEANUP_THRESHOLD;

    if (bytesInUse > threshold) {
      // Clear cache first
      await this.clearCache();

      // If still over quota after cache clear, log warning
      const newBytesInUse = await this.getBytesInUse();
      if (newBytesInUse > threshold) {
        console.warn('Storage still over quota after cache clear:', newBytesInUse);
      }
    }
  }

  /**
   * Initialize storage with defaults
   */
  async initialize(): Promise<void> {
    try {
      const result = await ChromeWrapper.storage.get<Record<string, any>>(['config', 'cache', 'lastSync']);
      
      if (!result.config) {
        await this.set('config', DEFAULT_CONFIG);
      }


      if (!result.cache) {
        await this.set('cache', {});
      }

      if (!result.lastSync) {
        await this.set('lastSync', { rules: 0 });
      }
    } catch (error) {
      console.error('Storage initialization error:', error);
    }
  }
}

// Singleton instance
export const storageService = new StorageService();
