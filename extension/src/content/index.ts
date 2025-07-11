/**
 * Content Script for ChatGPT
 */

import { MessageBus } from '../shared/messaging/MessageBus';
import { loggers } from '../shared/logging/Logger';
import type { ContentLoadedMessage, CheckResultMessage } from '../shared/types/messages';

const logger = loggers.content;
const messageBus = new MessageBus();

// Initialize Stinger Guard
async function initializeStingerGuard() {
  logger.info('Initializing Stinger Guard...');

  try {
    // Notify background that content script is loaded
    const message: Omit<ContentLoadedMessage, 'id' | 'timestamp'> = {
      type: 'CONTENT_LOADED',
      payload: {
        url: window.location.href,
        hostname: window.location.hostname,
      },
    };

    const response = await messageBus.send<ContentLoadedMessage>(message);
    logger.debug('Background response:', response);

    // Set up prompt interception
    setupPromptInterception();

    // Set up response monitoring
    setupResponseMonitoring();

    logger.info('Stinger Guard initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Stinger Guard', error);
  }
}

// Handle check results from background
messageBus.on<CheckResultMessage>('CHECK_RESULT', async (message) => {
  logger.info('Received check result', message.payload);

  // TODO: Implement UI feedback based on action
  switch (message.payload.action) {
    case 'block':
      logger.warn('Content blocked', message.payload.reasons);
      // TODO: Show block UI
      break;

    case 'warn':
      logger.warn('Content warning', message.payload.warnings);
      // TODO: Show warning UI
      break;

    case 'allow':
      logger.debug('Content allowed');
      break;
  }

  return { success: true };
});

// Placeholder for prompt interception
function setupPromptInterception() {
  logger.debug('Setting up prompt interception...');
  // TODO: Implement in Phase 3
}

// Placeholder for response monitoring
function setupResponseMonitoring() {
  logger.debug('Setting up response monitoring...');
  // TODO: Implement in Phase 3
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeStingerGuard);
} else {
  initializeStingerGuard();
}
