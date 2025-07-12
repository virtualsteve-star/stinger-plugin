/**
 * Rules Manager - Handles synchronization of policy rules from Stinger API
 */

import { stingerClient } from '../api/StingerClient';
import { storageService } from '../storage/StorageService';
import { loggers } from '../logging/Logger';
import type { PolicyRules } from '../types/storage';

const logger = loggers.background;

export class RulesManager {
  private syncInterval: number | null = null;
  private readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Start automatic rule synchronization
   */
  startSync(): void {
    logger.info('Starting rules synchronization');
    
    // Initial sync
    this.syncRules();
    
    // Set up periodic sync
    this.syncInterval = window.setInterval(() => {
      this.syncRules();
    }, this.SYNC_INTERVAL);
    
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
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    chrome.alarms.clear('sync-rules');
    logger.info('Stopped rules synchronization');
  }
  
  /**
   * Sync rules from API
   */
  async syncRules(): Promise<void> {
    try {
      logger.debug('Syncing rules from API');
      
      const result = await stingerClient.getRules();
      
      if (result.success) {
        const rules: PolicyRules = {
          version: result.data.version,
          preset: result.data.preset,
          guardrails: result.data.guardrails,
          lastUpdated: Date.now()
        };
        
        // Check if rules have changed
        const currentRules = await storageService.getRules();
        if (currentRules?.version !== rules.version) {
          logger.info('Rules updated', { 
            oldVersion: currentRules?.version, 
            newVersion: rules.version 
          });
          
          await storageService.updateRules(rules);
          
          // Notify content scripts of rule update
          this.notifyRuleUpdate(rules);
        } else {
          logger.debug('Rules unchanged');
        }
        
      } else {
        logger.error('Failed to sync rules', result.error);
      }
    } catch (error) {
      logger.error('Error syncing rules', error);
    }
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
    return await storageService.getRules() || null;
  }
  
  /**
   * Check if rules are still fresh
   */
  private isRulesFresh(rules: PolicyRules): boolean {
    const age = Date.now() - rules.lastUpdated;
    return age < this.SYNC_INTERVAL;
  }
  
  /**
   * Notify all tabs about rule updates
   */
  private async notifyRuleUpdate(rules: PolicyRules): Promise<void> {
    const tabs = await chrome.tabs.query({ url: 'https://chat.openai.com/*' });
    
    for (const tab of tabs) {
      if (tab.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'RULES_UPDATED',
            payload: {
              version: rules.version,
              preset: rules.preset
            }
          });
        } catch (error) {
          // Tab might not have content script loaded
          logger.debug('Failed to notify tab', { tabId: tab.id, error });
        }
      }
    }
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