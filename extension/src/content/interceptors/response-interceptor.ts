/**
 * Response Interceptor - Captures and checks LLM responses after streaming
 */

import { stingerClientV2 } from '../../shared/api/StingerClientV2';
import { loggers } from '../../shared/logging/Logger';
import { conversationManager } from '../utils/conversation-manager';

const logger = loggers.content;

export class ResponseInterceptor {
  private isMonitoring = false;
  private mutationObserver: MutationObserver | null = null;
  private processedMessages = new WeakSet<Element>();
  private processingContent = new Set<string>(); // Track content being processed
  private blockedMessages = new WeakSet<Element>(); // Track blocked messages

  constructor() {
    // Empty constructor
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

    // Find the actual message element (not containers)
    let messageElement: Element | null = null;

    // Direct assistant message element
    if (element.getAttribute('data-message-author-role') === 'assistant') {
      messageElement = element;
    } else {
      // Look for assistant message within this element
      messageElement = element.querySelector('[data-message-author-role="assistant"]');
    }

    if (!messageElement) {
      return;
    }

    // Skip if we've already processed this specific message
    if (this.processedMessages.has(messageElement)) {
      return;
    }

    // Mark both the container and message as processed
    this.processedMessages.add(element);
    this.processedMessages.add(messageElement);

    // Wait for streaming to complete
    this.waitForStreamingCompletion(messageElement);
  }

  /**
   * Wait for streaming to complete before checking
   */
  private waitForStreamingCompletion(messageElement: Element): void {
    let lastContent = '';
    let stableCount = 0;
    const requiredStableChecks = 3; // 300ms of stable content

    const checkInterval = setInterval(async () => {
      // Stop monitoring if message was blocked
      if (
        this.blockedMessages.has(messageElement) ||
        messageElement.classList.contains('stinger-blocked-response')
      ) {
        clearInterval(checkInterval);
        return;
      }

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

    // Skip if this is our own blocked content message
    if (content === 'I cannot provide that information due to safety policies.') {
      return;
    }

    // Skip if already marked as blocked
    if (messageElement.classList.contains('stinger-blocked-response')) {
      return;
    }

    // Skip if we're already processing this content
    const contentHash = content.substring(0, 100); // Use first 100 chars as simple hash
    if (this.processingContent.has(contentHash)) {
      return;
    }
    this.processingContent.add(contentHash);

    // Only check responses if there's an active conversation with prompts
    // This prevents creating orphaned anonymous conversations
    if (!conversationManager.hasActiveConversation()) {
      logger.info('Skipping response check - no active conversation with prompts');
      return;
    }

    try {
      // Check output with streaming_final mode
      // Use conversation ID from conversation manager
      await conversationManager.recordResponse();
      const context = await conversationManager.getApiContext();

      // Checking response with conversation context
      const result = await stingerClientV2.checkOutput(content, context);

      if (result.action === 'block') {
        // Block the response with visual indicator
        this.replaceBlockedContent(messageElement, result.reasons);
      } else if (result.warnings.length > 0) {
        // Only add warning if not already present
        if (!messageElement.querySelector('.stinger-warning-icon')) {
          this.addWarningIndicator(messageElement, result.warnings);
        }
      }
    } catch (error) {
      logger.error('Error checking response:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        contentLength: content.length,
      });
      // Fail open - don't block on errors
    } finally {
      // Clean up after a delay
      setTimeout(() => {
        this.processingContent.delete(contentHash);
      }, 5000);
    }
  }

  /**
   * Replace blocked content with safe message
   */
  private replaceBlockedContent(messageElement: Element, reasons: string[]): void {
    // Mark as blocked to prevent re-processing
    this.blockedMessages.add(messageElement);

    // Store original content as data attribute
    messageElement.setAttribute('data-original-content', messageElement.textContent || '');

    // Replace with formatted block message
    const blockHtml = `
      <div style="
        background: #FEF2F2;
        border: 1px solid #FECACA;
        border-radius: 8px;
        padding: 16px;
        margin: 8px 0;
      ">
        <div style="
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          color: #991B1B;
          font-weight: 600;
        ">
          <span style="margin-right: 8px;">🛑</span>
          Response Blocked by Stinger
        </div>
        
        <div style="
          color: #7F1D1D;
          margin-bottom: 12px;
        ">
          This response contains content that violates security policies:
        </div>
        
        <ul style="
          margin: 0;
          padding-left: 20px;
          color: #7F1D1D;
        ">
          ${reasons.map((reason) => `<li style="margin: 4px 0;">${this.escapeHtml(reason)}</li>`).join('')}
        </ul>
      </div>
    `;

    messageElement.innerHTML = blockHtml;

    // Add CSS class for additional styling
    messageElement.classList.add('stinger-blocked-response');
  }

  /**
   * Escape HTML for safe insertion
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
    border-left: 3px solid #ff9800 !important;
    padding-left: 10px !important;
    margin-left: 0 !important;
  }
  
  .stinger-warning-icon {
    margin-right: 8px;
    cursor: help;
  }
`;
document.head.appendChild(style);
