/**
 * Debug version of Response Interceptor with logging enabled
 */

import { stingerClientV2 } from '../../shared/api/StingerClientV2';
import { loggers } from '../../shared/logging/Logger';
import { StingerOverlay } from '../ui/overlay';

const logger = loggers.content;

export class ResponseInterceptorDebug {
  private overlay: StingerOverlay;
  private isMonitoring = false;
  private mutationObserver: MutationObserver | null = null;
  private processedMessages = new WeakSet<Element>();
  private messageCount = 0;

  constructor() {
    this.overlay = new StingerOverlay();
  }

  /**
   * Start monitoring for LLM responses
   */
  start(): void {
    if (this.isMonitoring) {
      console.log('[Stinger Debug] Already monitoring');
      return;
    }

    console.log('[Stinger Debug] Starting response interceptor');
    this.isMonitoring = true;

    // Watch for new assistant messages
    this.startMutationObserver();
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isMonitoring) return;

    console.log('[Stinger Debug] Stopping response interceptor');
    this.isMonitoring = false;

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }

  /**
   * Start mutation observer to detect new messages
   */
  private startMutationObserver(): void {
    // Find the chat container
    const chatContainer = this.findChatContainer();
    if (!chatContainer) {
      console.log('[Stinger Debug] Chat container not found, retrying in 1s');
      setTimeout(() => this.startMutationObserver(), 1000);
      return;
    }

    console.log('[Stinger Debug] Found chat container:', {
      tag: chatContainer.tagName,
      class: chatContainer.className,
      id: chatContainer.id
    });

    this.mutationObserver = new MutationObserver((mutations) => {
      console.log(`[Stinger Debug] Mutation detected, ${mutations.length} mutations`);
      
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            console.log('[Stinger Debug] New element added:', {
              tag: node.tagName,
              class: node.className,
              textPreview: node.textContent?.substring(0, 50) + '...'
            });
            this.checkForAssistantMessage(node);
          }
        }
      }
    });

    this.mutationObserver.observe(chatContainer, {
      childList: true,
      subtree: true,
    });

    console.log('[Stinger Debug] Mutation observer started');
  }

  /**
   * Find the chat container element
   */
  private findChatContainer(): Element | null {
    // Try different selectors for ChatGPT
    const selectors = ['main', '[class*="conversation"]', '[class*="chat"]', '[role="main"]'];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log(`[Stinger Debug] Found container with selector: ${selector}`);
        return element;
      }
    }

    return null;
  }

  /**
   * Check if element is an assistant message
   */
  private checkForAssistantMessage(element: Element): void {
    // Skip if already processed
    if (this.processedMessages.has(element)) {
      return;
    }

    // Check various indicators
    const checks = {
      hasAssistantClass: element.classList.toString().includes('assistant'),
      hasAssistantRole: !!element.querySelector('[data-message-author-role="assistant"]'),
      hasChatGPTText: element.textContent?.includes('ChatGPT') || false,
      hasPrevChatGPT: element.previousElementSibling?.textContent?.includes('ChatGPT') || false,
      isGroupWithAssistant: element.classList.contains('group') && !!element.querySelector('[data-message-author-role="assistant"]'),
      hasAssistantParent: !!element.closest('[data-message-author-role="assistant"]'),
      hasChatGPTAvatar: !!element.querySelector('img[alt*="ChatGPT"]'),
      isGroupWithoutUser: element.classList.contains('group') && 
                         element.classList.contains('w-full') && 
                         !element.querySelector('[data-message-author-role="user"]')
    };

    console.log('[Stinger Debug] Assistant message checks:', checks);

    const isAssistantMessage = Object.values(checks).some(v => v);

    if (!isAssistantMessage) {
      // Also check if this element contains assistant message content
      const assistantChild = element.querySelector('[data-message-author-role="assistant"]');
      if (!assistantChild) {
        console.log('[Stinger Debug] Not an assistant message, skipping');
        return;
      }
    }

    console.log('[Stinger Debug] Found assistant message!');
    this.processedMessages.add(element);
    this.messageCount++;

    // Wait for streaming to complete
    this.waitForStreamingCompletion(element);
  }

  /**
   * Wait for streaming to complete before checking
   */
  private waitForStreamingCompletion(messageElement: Element): void {
    console.log('[Stinger Debug] Waiting for streaming to complete...');
    
    let lastContent = '';
    let stableCount = 0;
    const requiredStableChecks = 3; // 300ms of stable content

    const checkInterval = setInterval(async () => {
      const currentContent = messageElement.textContent || '';

      if (currentContent === lastContent) {
        stableCount++;
        console.log(`[Stinger Debug] Content stable for ${stableCount * 100}ms`);

        if (stableCount >= requiredStableChecks) {
          clearInterval(checkInterval);
          console.log('[Stinger Debug] Streaming complete, checking response');
          await this.checkResponse(messageElement, currentContent);
        }
      } else {
        stableCount = 0;
        lastContent = currentContent;
        console.log('[Stinger Debug] Content still changing, resetting counter');
      }
    }, 100);

    // Timeout after 30 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      console.log('[Stinger Debug] Timeout reached, forcing check');
    }, 30000);
  }

  /**
   * Check the complete response with guardrails
   */
  private async checkResponse(messageElement: Element, content: string): Promise<void> {
    if (!content.trim()) {
      console.log('[Stinger Debug] Empty content, skipping');
      return;
    }

    try {
      console.log('[Stinger Debug] Checking response with Stinger API:', {
        contentLength: content.length,
        hasCode: messageElement.querySelector('code') !== null,
        messageNumber: this.messageCount
      });

      // Check output with streaming_final mode
      const conversationId = `chrome_ext_${Date.now()}`;
      const result = await stingerClientV2.checkOutput(content, conversationId);

      console.log('[Stinger Debug] API Response:', result);

      if (result.action === 'block') {
        console.log('[Stinger Debug] Response BLOCKED:', result.reasons);
        this.replaceBlockedContent(messageElement, result.reasons);
      } else if (result.warnings.length > 0) {
        console.log('[Stinger Debug] Response has WARNINGS:', result.warnings);
        this.addWarningIndicator(messageElement, result.warnings);
      } else {
        console.log('[Stinger Debug] Response ALLOWED');
      }
    } catch (error) {
      console.error('[Stinger Debug] Error checking response:', error);
      // Fail open - don't block on errors
    }
  }

  /**
   * Replace blocked content with safe message
   */
  private replaceBlockedContent(messageElement: Element, reasons: string[]): void {
    console.log('[Stinger Debug] Replacing blocked content');
    
    // Store original content as data attribute
    messageElement.setAttribute('data-original-content', messageElement.textContent || '');

    // Replace with safe message
    messageElement.textContent = 'I cannot provide that information due to safety policies.';

    // Add visual indicator
    messageElement.classList.add('stinger-blocked-response');

    // Add tooltip with reasons
    const tooltip = document.createElement('div');
    tooltip.className = 'stinger-block-tooltip';
    tooltip.textContent = `Blocked: ${reasons.join(', ')}`;
    messageElement.appendChild(tooltip);

    // Show overlay notification
    this.overlay.showBlockedNotification(reasons);
  }

  /**
   * Add warning indicator to message
   */
  private addWarningIndicator(messageElement: Element, warnings: string[]): void {
    console.log('[Stinger Debug] Adding warning indicator');
    
    // Add warning class
    messageElement.classList.add('stinger-warning-response');

    // Add warning icon
    const warningIcon = document.createElement('span');
    warningIcon.className = 'stinger-warning-icon';
    warningIcon.textContent = '⚠️';
    warningIcon.title = warnings.join(', ');

    // Insert at beginning of message
    messageElement.insertBefore(warningIcon, messageElement.firstChild);
  }
}

// Export debug version
(window as any).StingerResponseInterceptorDebug = ResponseInterceptorDebug;