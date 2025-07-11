/**
 * Message Bus for Type-Safe Chrome Extension Communication
 */

import type {
  ExtensionMessage,
  MessageResponse,
  BackgroundToContentMessage,
} from '../types/messages';
import { isExtensionMessage } from '../utils/type-guards';
import { generateId } from '../utils/helpers';

export type MessageHandler<T extends ExtensionMessage> = (
  message: T,
  sender: chrome.runtime.MessageSender,
) => Promise<MessageResponse> | MessageResponse;

export class MessageBus {
  private handlers = new Map<string, MessageHandler<any>[]>();
  private pendingResponses = new Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (error: any) => void;
      timeout: NodeJS.Timeout;
    }
  >();

  constructor(private readonly timeout: number = 5000) {
    // Set up the main message listener
    chrome.runtime.onMessage.addListener(
      (
        message: any,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: any) => void,
      ) => {
        this.handleMessage(message, sender, sendResponse);
        return true; // Keep channel open for async response
      },
    );
  }

  /**
   * Register a handler for a specific message type
   */
  on<T extends ExtensionMessage>(type: T['type'], handler: MessageHandler<T>): () => void {
    const handlers = this.handlers.get(type) || [];
    handlers.push(handler);
    this.handlers.set(type, handlers);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(type) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  }

  /**
   * Send a message and wait for response
   */
  async send<T extends ExtensionMessage, R = any>(
    message: Omit<T, 'id' | 'timestamp'>,
  ): Promise<R> {
    const fullMessage = {
      ...message,
      id: generateId(),
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingResponses.delete(fullMessage.id);
        reject(new Error(`Message timeout: ${message.type}`));
      }, this.timeout);

      this.pendingResponses.set(fullMessage.id, { resolve, reject, timeout });

      chrome.runtime.sendMessage(fullMessage, (response) => {
        if (chrome.runtime.lastError) {
          this.pendingResponses.delete(fullMessage.id);
          clearTimeout(timeout);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        const pending = this.pendingResponses.get(fullMessage.id);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingResponses.delete(fullMessage.id);

          if (response?.success === false) {
            reject(new Error(response.error || 'Unknown error'));
          } else {
            resolve(response?.data);
          }
        }
      });
    });
  }

  /**
   * Send a message to a specific tab
   */
  async sendToTab<T extends BackgroundToContentMessage, R = any>(
    tabId: number,
    message: Omit<T, 'id' | 'timestamp'>,
  ): Promise<R> {
    const fullMessage = {
      ...message,
      id: generateId(),
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, fullMessage, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (response?.success === false) {
          reject(new Error(response.error || 'Unknown error'));
        } else {
          resolve(response?.data);
        }
      });
    });
  }

  /**
   * Handle incoming messages
   */
  private async handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ) {
    try {
      // Validate message format
      if (!isExtensionMessage(message)) {
        sendResponse({ success: false, error: 'Invalid message format' });
        return;
      }

      // Get handlers for this message type
      const handlers = this.handlers.get(message.type) || [];

      if (handlers.length === 0) {
        sendResponse({ success: false, error: `No handler for message type: ${message.type}` });
        return;
      }

      // Execute all handlers
      const results = await Promise.all(handlers.map((handler) => handler(message, sender)));

      // Return the first successful result
      const successResult = results.find((r) => r.success);
      sendResponse(successResult || results[0]);
    } catch (error) {
      console.error('MessageBus error:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Clear all handlers and pending responses
   */
  destroy() {
    this.handlers.clear();
    this.pendingResponses.forEach(({ timeout }) => clearTimeout(timeout));
    this.pendingResponses.clear();
  }
}
