/**
 * Content Script for ChatGPT
 */

import { MessageBus } from '../shared/messaging/MessageBus';
import { loggers } from '../shared/logging/Logger';
import { ChatGPTDOMObserver } from './observers/dom-observer';
import { PromptInterceptor } from './interceptors/prompt-interceptor';
import { ResponseMonitor } from './interceptors/response-monitor';
import type { ContentLoadedMessage } from '../shared/types/messages';

const logger = loggers.content;
const messageBus = new MessageBus();

// Components
let domObserver: ChatGPTDOMObserver | null = null;
let promptInterceptor: PromptInterceptor | null = null;
let responseMonitor: ResponseMonitor | null = null;

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

    // Set up DOM observation
    setupDOMObservation();

    logger.info('Stinger Guard initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Stinger Guard', error);
  }
}

// Set up prompt interception
function setupPromptInterception() {
  logger.debug('Setting up prompt interception...');
  
  promptInterceptor = new PromptInterceptor(messageBus);
  promptInterceptor.start();
}

// Set up response monitoring
function setupResponseMonitoring() {
  logger.debug('Setting up response monitoring...');
  
  responseMonitor = new ResponseMonitor(messageBus);
}

// Set up DOM observation
function setupDOMObservation() {
  logger.debug('Setting up DOM observation...');
  
  domObserver = new ChatGPTDOMObserver({
    onNewUserMessage: (_text) => {
      logger.debug('New user message detected via DOM observation');
      // The prompt interceptor handles checking before submission
    },
    
    onNewAssistantMessage: (text) => {
      logger.debug('New assistant message detected');
      if (responseMonitor) {
        responseMonitor.checkResponse(text);
      }
    },
    
    onAssistantMessageUpdate: (text) => {
      logger.debug('Assistant message updated');
      if (responseMonitor) {
        responseMonitor.checkResponse(text);
      }
    },
    
    onGenerationStart: () => {
      logger.debug('Response generation started');
    },
    
    onGenerationEnd: () => {
      logger.debug('Response generation ended');
    },
  });
  
  domObserver.start();
}

// Clean up on unload
window.addEventListener('unload', () => {
  logger.info('Content script unloading, cleaning up...');
  
  if (domObserver) {
    domObserver.stop();
  }
  
  if (promptInterceptor) {
    promptInterceptor.stop();
  }
});

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeStingerGuard);
} else {
  initializeStingerGuard();
}
