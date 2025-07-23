/**
 * Content Script for ChatGPT
 */

import { MessageBus } from '../shared/messaging/MessageBus';
import { loggers } from '../shared/logging/Logger';
import { ChatGPTDOMObserver } from './observers/dom-observer';
import { PromptInterceptor } from './interceptors/prompt-interceptor';
import { ResponseInterceptor } from './interceptors/response-interceptor';
import type { ContentLoadedMessage } from '../shared/types/messages';

const logger = loggers.content;
const messageBus = new MessageBus();

// Simple DOM-based interception approach

// Components
let domObserver: ChatGPTDOMObserver | null = null;
let promptInterceptor: PromptInterceptor | null = null;
let responseInterceptor: ResponseInterceptor | null = null;

// Initialize Stinger Guard
async function initializeStingerGuard() {
  // Removed info log for production

  try {
    // Notify background that content script is loaded
    const message: Omit<ContentLoadedMessage, 'id' | 'timestamp'> = {
      type: 'CONTENT_LOADED',
      payload: {
        url: window.location.href,
        hostname: window.location.hostname,
      },
    };

    await messageBus.send<ContentLoadedMessage>(message);
    // Removed debug log for production

    // Set up prompt interception
    setupPromptInterception();

    // Set up response monitoring
    setupResponseMonitoring();

    // Set up DOM observation
    setupDOMObservation();

    // Removed info log for production
  } catch (error) {
    logger.error('Failed to initialize Stinger Guard', error);
  }
}

// Set up prompt interception
function setupPromptInterception() {
  // Removed debug log for production

  promptInterceptor = new PromptInterceptor();
  promptInterceptor.start();
}

// Set up response monitoring
function setupResponseMonitoring() {
  // Removed debug log for production

  // Only use Phase 15 response interceptor (not legacy ResponseMonitor)
  // responseMonitor = new ResponseMonitor(messageBus);

  // Set up Phase 15 response interceptor
  responseInterceptor = new ResponseInterceptor();
  responseInterceptor.start();
}

// Set up DOM observation
function setupDOMObservation() {
  // Removed debug log for production

  domObserver = new ChatGPTDOMObserver({
    onNewUserMessage: (_text) => {
      // Removed debug log for production
      // The prompt interceptor handles checking before submission
    },

    onNewAssistantMessage: (_text) => {
      // Removed debug log for production
      // Legacy response monitoring disabled - using ResponseInterceptor instead
    },

    onAssistantMessageUpdate: (_text) => {
      // Removed debug log for production
      // Legacy response monitoring disabled - using ResponseInterceptor instead
    },

    onGenerationStart: () => {
      // Removed debug log for production
    },

    onGenerationEnd: () => {
      // Removed debug log for production
    },
  });

  domObserver.start();
}

// Clean up on unload
window.addEventListener('unload', () => {
  // Removed info log for production

  if (domObserver) {
    domObserver.stop();
  }

  if (promptInterceptor) {
    promptInterceptor.stop();
  }

  if (responseInterceptor) {
    responseInterceptor.stop();
  }
});

// Log initial state
// Removed info log for production

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  // Removed info log for production
  document.addEventListener('DOMContentLoaded', initializeStingerGuard);
} else {
  // Give ChatGPT a moment to fully render
  // Removed info log for production
  setTimeout(initializeStingerGuard, 1000);
}
