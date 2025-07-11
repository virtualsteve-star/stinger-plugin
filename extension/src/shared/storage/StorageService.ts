/**
 * Storage Service - Abstraction layer for Chrome extension storage
 */

import { ChromeWrapper } from '../chrome/ChromeWrapper';
import type { StorageSchema, ExtensionConfig, PolicyRules, AuditEvent } from '../types/storage';
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

  /**
   * Get a value from storage
   */
  async get<K extends keyof StorageSchema>(key: K): Promise<StorageSchema[K] | undefined> {
    const result = await ChromeWrapper.storage.get<Record<string, any>>(key as string);

    // Apply defaults for config
    if (key === 'config' && !result[key]) {
      return DEFAULT_CONFIG as StorageSchema[K];
    }

    return result[key] as StorageSchema[K] | undefined;
  }

  /**
   * Set a value in storage
   */
  async set<K extends keyof StorageSchema>(key: K, value: StorageSchema[K]): Promise<void> {
    // Check storage quota before writing
    await this.checkStorageQuota();

    await ChromeWrapper.storage.set({ [key]: value });
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
    const config = await this.get('config');
    return { ...DEFAULT_CONFIG, ...config };
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
   * Add audit event to queue
   */
  async addAuditEvent(event: AuditEvent): Promise<void> {
    const queue = (await this.get('auditQueue')) || [];
    queue.push(event);

    // Limit queue size to prevent unbounded growth
    const MAX_QUEUE_SIZE = 1000;
    if (queue.length > MAX_QUEUE_SIZE) {
      queue.splice(0, queue.length - MAX_QUEUE_SIZE);
    }

    await this.set('auditQueue', queue);
  }

  /**
   * Get and clear audit queue
   */
  async getAndClearAuditQueue(): Promise<AuditEvent[]> {
    const queue = (await this.get('auditQueue')) || [];
    await this.set('auditQueue', []);
    return queue;
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
    await this.set('cache', {});
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

    if (bytesInUse > this.MAX_STORAGE_BYTES * this.CACHE_CLEANUP_THRESHOLD) {
      // Clear cache first
      await this.clearCache();

      // If still over quota, trim audit queue
      const newBytesInUse = await this.getBytesInUse();
      if (newBytesInUse > this.MAX_STORAGE_BYTES * this.CACHE_CLEANUP_THRESHOLD) {
        const queue = (await this.get('auditQueue')) || [];
        if (queue.length > 100) {
          // Keep only recent 100 events
          await this.set('auditQueue', queue.slice(-100));
        }
      }
    }
  }

  /**
   * Initialize storage with defaults
   */
  async initialize(): Promise<void> {
    const config = await this.get('config');
    if (!config) {
      await this.set('config', DEFAULT_CONFIG);
    }

    // Initialize other storage keys if needed
    const auditQueue = await this.get('auditQueue');
    if (!auditQueue) {
      await this.set('auditQueue', []);
    }

    const cache = await this.get('cache');
    if (!cache) {
      await this.set('cache', {});
    }

    const lastSync = await this.get('lastSync');
    if (!lastSync) {
      await this.set('lastSync', { rules: 0, audit: 0 });
    }
  }
}

// Singleton instance
export const storageService = new StorageService();
