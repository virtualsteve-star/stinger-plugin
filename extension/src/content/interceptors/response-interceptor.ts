/**
 * Response Interceptor - Captures and checks LLM responses after streaming
 */

import { stingerClientV2 } from '../../shared/api/StingerClientV2';
import { loggers } from '../../shared/logging/Logger';
import { StingerOverlay } from '../ui/overlay';

const logger = loggers.content;

export class ResponseInterceptor {
  private overlay: StingerOverlay;
  private isMonitoring = false;
  private mutationObserver: MutationObserver | null = null;
  private processedMessages = new WeakSet<Element>();

  constructor() {
    this.overlay = new StingerOverlay();
  }

  /**
   * Start monitoring for LLM responses
   */
  start(): void {
    if (this.isMonitoring) {
      // Removed debug log for production
      return;
    }

    // Removed info log for production
    this.isMonitoring = true;

    // Watch for new assistant messages
    this.startMutationObserver();
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isMonitoring) return;

    // Removed info log for production
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
      logger.warn('Chat container not found, retrying in 1s');
      setTimeout(() => this.startMutationObserver(), 1000);
      return;
    }

    this.mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            this.checkForAssistantMessage(node);
          }
        }
      }
    });

    this.mutationObserver.observe(chatContainer, {
      childList: true,
      subtree: true,
    });

    // Removed info log for production
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

    // Look for assistant message indicators
    const isAssistantMessage =
      element.classList.toString().includes('assistant') ||
      element.querySelector('[data-message-author-role="assistant"]') ||
      element.textContent?.includes('ChatGPT') ||
      (element.previousElementSibling?.textContent?.includes('ChatGPT') ?? false);

    if (!isAssistantMessage) {
      return;
    }

    // Removed debug log for production
    this.processedMessages.add(element);

    // Wait for streaming to complete
    this.waitForStreamingCompletion(element);
  }

  /**
   * Wait for streaming to complete before checking
   */
  private waitForStreamingCompletion(messageElement: Element): void {
    let lastContent = '';
    let stableCount = 0;
    const requiredStableChecks = 3; // 300ms of stable content

    const checkInterval = setInterval(async () => {
      const currentContent = messageElement.textContent || '';

      if (currentContent === lastContent) {
        stableCount++;

        if (stableCount >= requiredStableChecks) {
          clearInterval(checkInterval);
          // Removed info log for production
          await this.checkResponse(messageElement, currentContent);
        }
      } else {
        stableCount = 0;
        lastContent = currentContent;
      }
    }, 100);

    // Timeout after 30 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 30000);
  }

  /**
   * Check the complete response with guardrails
   */
  private async checkResponse(messageElement: Element, content: string): Promise<void> {
    if (!content.trim()) {
      return;
    }

    try {
      // Removed info log for production

      // Check output with streaming_final mode
      // Use consistent conversation ID
      const conversationId = `chrome_ext_${Date.now()}`;
      const result = await stingerClientV2.checkOutput(content, conversationId);

      if (result.action === 'block') {
        logger.warn('Response blocked:', result.reasons);
        this.replaceBlockedContent(messageElement, result.reasons);
      } else if (result.warnings.length > 0) {
        // Log warnings as they are important for security
        logger.warn('Response has warnings:', result.warnings);
        this.addWarningIndicator(messageElement, result.warnings);
      }

      // Log metadata
      // Removed debug log for production
    } catch (error) {
      logger.error('Error checking response:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        contentLength: content.length,
      });
      // Fail open - don't block on errors
    }
  }

  /**
   * Replace blocked content with safe message
   */
  private replaceBlockedContent(messageElement: Element, reasons: string[]): void {
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

// Add styles for blocked/warning indicators
const style = document.createElement('style');
style.textContent = `
  .stinger-blocked-response {
    opacity: 0.6;
    position: relative;
  }
  
  .stinger-block-tooltip {
    position: absolute;
    top: -30px;
    left: 0;
    background: #ff4444;
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    display: none;
  }
  
  .stinger-blocked-response:hover .stinger-block-tooltip {
    display: block;
  }
  
  .stinger-warning-response {
    border-left: 3px solid #ff9800;
    padding-left: 10px;
  }
  
  .stinger-warning-icon {
    margin-right: 8px;
    cursor: help;
  }
`;
document.head.appendChild(style);
