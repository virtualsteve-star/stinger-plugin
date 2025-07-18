/**
 * Background Service Worker
 */

import { MessageBus } from '../shared/messaging/MessageBus';
import { storageService } from '../shared/storage/StorageService';
import { stingerClientV2 } from '../shared/api/StingerClientV2';
import { loggers } from '../shared/logging/Logger';
import { withErrorHandler } from '../shared/utils/error-handling';
import { buildConversationContext } from '../shared/utils/conversation-tracking';
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
    await storageService.getConfig();
    // Phase 15 client doesn't have updateConfig method - singleton handles configuration

    // Check API health
    const health = await stingerClientV2.healthCheck();
    if (health) {
      logger.info('API health check passed (Phase 15)');
    } else {
      logger.warn('API health check failed (Phase 15)');
    }

    // Skip rules synchronization for Phase 15 API
    // The Phase 15 API uses presets (like demo_showcase) instead of dynamic rules
    logger.info('Rules sync disabled - using Phase 15 API presets');

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
    // Build conversation context from the tab URL
    const tabUrl = sender.tab?.url || 'unknown';
    const context = await buildConversationContext(tabUrl);

    // Use Phase 15 API
    const conversationId = `chrome_ext_${Date.now()}`;
    const result = await stingerClientV2.checkInput(message.payload.text, conversationId);

    // Note: Audit logging is handled by the Stinger backend
    // We do NOT store audit events locally
    logger.debug('Prompt check complete', {
      action: result.action,
      userId: context.userId,
      botId: context.botId,
    });

    // Send result back to content script
    const response: CheckResultMessage = {
      id: `result-${Date.now()}`,
      timestamp: Date.now(),
      type: 'CHECK_RESULT',
      payload: {
        action: result.action,
        reasons: result.reasons,
        warnings: result.warnings,
        originalMessageId: message.id,
      },
    };

    if (sender.tab?.id) {
      await messageBus.sendToTab(sender.tab.id, response);
    }

    return { success: true, data: result };
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
    // Build conversation context from the tab URL
    const tabUrl = sender.tab?.url || 'unknown';
    const context = await buildConversationContext(tabUrl);

    // Use Phase 15 API
    const conversationId = `chrome_ext_${Date.now()}`;
    const result = await stingerClientV2.checkOutput(message.payload.text, conversationId);

    // Note: Audit logging is handled by the Stinger backend
    // We do NOT store audit events locally
    logger.debug('Response check complete', {
      action: result.action,
      userId: context.userId,
      botId: context.botId,
    });

    // Send result back to content script
    const response: CheckResultMessage = {
      id: `result-${Date.now()}`,
      timestamp: Date.now(),
      type: 'CHECK_RESULT',
      payload: {
        action: result.action,
        reasons: result.reasons,
        warnings: result.warnings,
        originalMessageId: message.id,
      },
    };

    if (sender.tab?.id) {
      await messageBus.sendToTab(sender.tab.id, response);
    }

    return { success: true, data: result };
  } catch (error) {
    logger.error('Error checking response', error);
    return { success: false, error: 'Internal error' };
  }
});

// Handle extension installation/update
chrome.runtime.onInstalled.addListener(
  withErrorHandler((details) => {
    logger.info('Extension installed/updated', details);
    initialize();
  }, 'onInstalled'),
);

// Initialize on startup
initialize();
