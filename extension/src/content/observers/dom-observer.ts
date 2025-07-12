/**
 * DOM Observer for ChatGPT Interface Changes
 */

import { loggers } from '../../shared/logging/Logger';
import { getLatestAssistantMessage, isGenerating } from '../selectors/chatgpt';

const logger = loggers.content;

export interface DOMObserverCallbacks {
  onNewUserMessage?: (text: string) => void;
  onNewAssistantMessage?: (text: string) => void;
  onAssistantMessageUpdate?: (text: string) => void;
  onGenerationStart?: () => void;
  onGenerationEnd?: () => void;
}

export class ChatGPTDOMObserver {
  private observer: MutationObserver | null = null;
  private callbacks: DOMObserverCallbacks;
  private isCurrentlyGenerating = false;
  private lastAssistantMessage = '';
  private observerConfig: MutationObserverInit = {
    childList: true,
    subtree: true,
    characterData: true,
    characterDataOldValue: true,
  };

  constructor(callbacks: DOMObserverCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Start observing the ChatGPT interface
   */
  start(): void {
    if (this.observer) {
      logger.warn('Observer already started');
      return;
    }

    logger.info('Starting DOM observer');

    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });

    // Observe the entire document body for changes
    this.observer.observe(document.body, this.observerConfig);

    // Set up periodic checks for generation status
    this.startGenerationMonitoring();
  }

  /**
   * Stop observing
   */
  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      logger.info('DOM observer stopped');
    }
  }

  /**
   * Handle DOM mutations
   */
  private handleMutations(mutations: MutationRecord[]): void {
    // Look for new message elements
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        this.checkForNewMessages(mutation);
      } else if (mutation.type === 'characterData') {
        this.checkForMessageUpdates(mutation);
      }
    }
  }

  /**
   * Check if new messages were added
   */
  private checkForNewMessages(mutation: MutationRecord): void {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      
      const element = node as Element;
      
      // Check if this is a user message
      if (element.matches?.('[data-message-author-role="user"]') ||
          element.querySelector?.('[data-message-author-role="user"]')) {
        const text = this.extractMessageText(element);
        if (text && this.callbacks.onNewUserMessage) {
          logger.debug('New user message detected:', text.substring(0, 50) + '...');
          this.callbacks.onNewUserMessage(text);
        }
      }
      
      // Check if this is an assistant message
      if (element.matches?.('[data-message-author-role="assistant"]') ||
          element.querySelector?.('[data-message-author-role="assistant"]')) {
        const text = this.extractMessageText(element);
        if (text && this.callbacks.onNewAssistantMessage) {
          logger.debug('New assistant message detected');
          this.callbacks.onNewAssistantMessage(text);
          this.lastAssistantMessage = text;
        }
      }
    });
  }

  /**
   * Check for updates to existing messages (streaming responses)
   */
  private checkForMessageUpdates(mutation: MutationRecord): void {
    // Find the closest message container
    let element = mutation.target as Node;
    while (element && element.nodeType === Node.TEXT_NODE) {
      element = element.parentNode as Node;
    }
    
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return;
    
    const messageContainer = (element as Element).closest('[data-message-author-role="assistant"]');
    if (messageContainer) {
      const text = this.extractMessageText(messageContainer);
      if (text && text !== this.lastAssistantMessage && this.callbacks.onAssistantMessageUpdate) {
        logger.debug('Assistant message updated');
        this.callbacks.onAssistantMessageUpdate(text);
        this.lastAssistantMessage = text;
      }
    }
  }

  /**
   * Extract text content from a message element
   */
  private extractMessageText(element: Element): string {
    const contentEl = element.querySelector('.markdown.prose') || 
                     element.querySelector('div[class*="markdown"]') ||
                     element.querySelector('.text-base');
    
    return contentEl?.textContent?.trim() || '';
  }

  /**
   * Monitor for generation start/end
   */
  private startGenerationMonitoring(): void {
    setInterval(() => {
      const currentlyGenerating = isGenerating();
      
      if (currentlyGenerating && !this.isCurrentlyGenerating) {
        // Generation started
        this.isCurrentlyGenerating = true;
        if (this.callbacks.onGenerationStart) {
          logger.debug('Generation started');
          this.callbacks.onGenerationStart();
        }
      } else if (!currentlyGenerating && this.isCurrentlyGenerating) {
        // Generation ended
        this.isCurrentlyGenerating = false;
        if (this.callbacks.onGenerationEnd) {
          logger.debug('Generation ended');
          this.callbacks.onGenerationEnd();
          
          // Check final message
          const finalMessage = getLatestAssistantMessage();
          if (finalMessage && finalMessage !== this.lastAssistantMessage) {
            if (this.callbacks.onAssistantMessageUpdate) {
              this.callbacks.onAssistantMessageUpdate(finalMessage);
            }
            this.lastAssistantMessage = finalMessage;
          }
        }
      }
    }, 500); // Check every 500ms
  }
}