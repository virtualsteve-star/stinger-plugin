/**
 * Rules Manager - Handles synchronization of policy rules from Stinger API
 */

import { storageService } from '../storage/StorageService';
import { loggers } from '../logging/Logger';
import type { PolicyRules } from '../types/storage';

const logger = loggers.background;

export class RulesManager {
  private readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

  /**
   * Start automatic rule synchronization
   */
  startSync(): void {
    logger.info('Starting rules synchronization');

    // Initial sync
    this.syncRules();

    // Set up periodic sync using Chrome alarms API (service workers don't have setInterval)
    // this.syncInterval = setInterval(() => {
    //   this.syncRules();
    // }, this.SYNC_INTERVAL);

    // Also sync on alarm (Chrome's preferred method for background tasks)
    chrome.alarms.create('sync-rules', { periodInMinutes: 5 });
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'sync-rules') {
        this.syncRules();
      }
    });
  }

  /**
   * Stop automatic synchronization
   */
  stopSync(): void {
    chrome.alarms.clear('sync-rules');
    logger.info('Stopped rules synchronization');
  }

  /**
   * Sync rules from API
   */
  async syncRules(): Promise<void> {
    // Skip sync for Phase 15 API - uses presets instead
    logger.debug('Rules sync skipped - Phase 15 API uses presets');
    return;
  }

  /**
   * Get current rules (from storage or API)
   */
  async getRules(): Promise<PolicyRules | null> {
    // Try to get from storage first
    const storedRules = await storageService.getRules();

    if (storedRules && this.isRulesFresh(storedRules)) {
      return storedRules;
    }

    // Otherwise sync from API
    await this.syncRules();
    return (await storageService.getRules()) || null;
  }

  /**
   * Check if rules are still fresh
   */
  private isRulesFresh(rules: PolicyRules): boolean {
    const age = Date.now() - rules.lastUpdated;
    return age < this.SYNC_INTERVAL;
  }

  /**
   * Force immediate rule sync
   */
  async forceSync(): Promise<void> {
    logger.info('Force syncing rules');
    await this.syncRules();
  }
}

// Export singleton instance
export const rulesManager = new RulesManager();
