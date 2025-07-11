/**
 * Background Service Worker
 */

import { MessageBus } from '../shared/messaging/MessageBus';
import { storageService } from '../shared/storage/StorageService';
import { stingerClient } from '../shared/api/StingerClient';
import { loggers } from '../shared/logging/Logger';
import { withErrorHandler } from '../shared/utils/error-handling';
import type {
  ContentLoadedMessage,
  CheckPromptMessage,
  CheckResponseMessage,
  CheckResultMessage,
} from '../shared/types/messages';

const logger = loggers.background;
const messageBus = new MessageBus();

// Initialize on startup
async function initialize() {
  logger.info('Background service worker starting...');

  try {
    // Initialize storage with defaults
    await storageService.initialize();

    // Load configuration
    const config = await storageService.getConfig();
    stingerClient.updateConfig({
      baseUrl: config.apiUrl,
      timeout: config.apiTimeout,
    });

    // Check API health
    const health = await stingerClient.health();
    if (health.success) {
      logger.info('API health check passed', health.data);
    } else {
      logger.warn('API health check failed', health.error);
    }

    // Load rules
    const rules = await stingerClient.getRules();
    if (rules.success) {
      logger.info('Rules loaded', { version: rules.data.version });
    }

    logger.info('Background service worker initialized');
  } catch (error) {
    logger.error('Failed to initialize background worker', error);
  }
}

// Handle content script loaded
messageBus.on<ContentLoadedMessage>('CONTENT_LOADED', async (message, sender) => {
  logger.debug('Content script loaded', {
    url: message.payload.url,
    tabId: sender.tab?.id,
  });

  return {
    success: true,
    data: {
      message: 'Background worker received content load',
      config: await storageService.getConfig(),
    },
  };
});

// Handle prompt check
messageBus.on<CheckPromptMessage>('CHECK_PROMPT', async (message, sender) => {
  logger.info('Checking prompt', {
    textLength: message.payload.text.length,
    tabId: sender.tab?.id,
  });

  try {
    const config = await storageService.getConfig();
    const result = await stingerClient.checkContent({
      text: message.payload.text,
      kind: 'prompt',
      tenantId: config.tenantId,
      userId: config.userId,
    });

    if (result.success) {
      // Log audit event
      await storageService.addAuditEvent({
        id: `audit-${Date.now()}`,
        timestamp: Date.now(),
        type: 'prompt',
        action: result.data.action,
        text: message.payload.text,
        hash: await hashText(message.payload.text),
        url: sender.tab?.url || 'unknown',
        reasons: result.data.reasons,
        metadata: message.payload.metadata,
      });

      // Send result back to content script
      const response: CheckResultMessage = {
        id: `result-${Date.now()}`,
        timestamp: Date.now(),
        type: 'CHECK_RESULT',
        payload: {
          action: result.data.action,
          reasons: result.data.reasons,
          warnings: result.data.warnings,
          originalMessageId: message.id,
        },
      };

      if (sender.tab?.id) {
        await messageBus.sendToTab(sender.tab.id, response);
      }

      return { success: true, data: result.data };
    } else {
      logger.error('Prompt check failed', result.error);
      return { success: false, error: result.error.message };
    }
  } catch (error) {
    logger.error('Error checking prompt', error);
    return { success: false, error: 'Internal error' };
  }
});

// Handle response check
messageBus.on<CheckResponseMessage>('CHECK_RESPONSE', async (message, sender) => {
  logger.info('Checking response', {
    textLength: message.payload.text.length,
    tabId: sender.tab?.id,
  });

  try {
    const config = await storageService.getConfig();
    const result = await stingerClient.checkContent({
      text: message.payload.text,
      kind: 'response',
      tenantId: config.tenantId,
      userId: config.userId,
    });

    if (result.success) {
      // Log audit event
      await storageService.addAuditEvent({
        id: `audit-${Date.now()}`,
        timestamp: Date.now(),
        type: 'response',
        action: result.data.action,
        text: message.payload.text,
        hash: await hashText(message.payload.text),
        url: sender.tab?.url || 'unknown',
        reasons: result.data.reasons,
        metadata: message.payload.metadata,
      });

      // Send result back to content script
      const response: CheckResultMessage = {
        id: `result-${Date.now()}`,
        timestamp: Date.now(),
        type: 'CHECK_RESULT',
        payload: {
          action: result.data.action,
          reasons: result.data.reasons,
          warnings: result.data.warnings,
          originalMessageId: message.id,
        },
      };

      if (sender.tab?.id) {
        await messageBus.sendToTab(sender.tab.id, response);
      }

      return { success: true, data: result.data };
    } else {
      logger.error('Response check failed', result.error);
      return { success: false, error: result.error.message };
    }
  } catch (error) {
    logger.error('Error checking response', error);
    return { success: false, error: 'Internal error' };
  }
});

// Simple hash function for MVP
async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Handle extension installation/update
chrome.runtime.onInstalled.addListener(
  withErrorHandler((details) => {
    logger.info('Extension installed/updated', details);
    initialize();
  }, 'onInstalled'),
);

// Initialize on startup
initialize();
