/**
 * Response Monitor - Checks ChatGPT responses for policy violations
 */

import { MessageBus } from '../../shared/messaging/MessageBus';
import { loggers } from '../../shared/logging/Logger';
import type { CheckResponseMessage, CheckResultMessage } from '../../shared/types/messages';

// Helper to detect ChatGPT model
function detectChatGPTModel(): string {
  const modelButton = document.querySelector('button[aria-haspopup="menu"]');
  if (modelButton) {
    const text = modelButton.textContent || '';
    if (text.includes('GPT-4')) return 'gpt-4';
    if (text.includes('GPT-3.5')) return 'gpt-3.5-turbo';
  }
  return 'gpt-4';
}

const logger = loggers.content;

export class ResponseMonitor {
  private messageBus: MessageBus;
  private lastCheckedResponse = '';
  private isCheckingResponse = false;

  constructor(messageBus: MessageBus) {
    this.messageBus = messageBus;
  }

  /**
   * Check a new or updated response
   */
  async checkResponse(text: string): Promise<void> {
    // Skip if same as last checked
    if (text === this.lastCheckedResponse) {
      return;
    }

    // Skip if already checking
    if (this.isCheckingResponse) {
      return;
    }

    this.isCheckingResponse = true;
    this.lastCheckedResponse = text;

    try {
      logger.info('Checking response:', text.substring(0, 50) + '...');
      
      // Send response to background for checking
      const message: Omit<CheckResponseMessage, 'id' | 'timestamp'> = {
        type: 'CHECK_RESPONSE',
        payload: {
          text: text,
          metadata: {
            conversationId: `session-${Date.now()}`,
            messageId: `msg-${Date.now()}`,
            model: detectChatGPTModel(),
          },
        },
      };

      // Wait for check result
      const resultPromise = this.waitForCheckResult();
      await this.messageBus.send(message);
      const result = await resultPromise;

      logger.info('Response check result:', result.action);

      // Handle the result
      switch (result.action) {
        case 'allow':
          // Response is fine, do nothing
          break;
          
        case 'warn':
          // Show warning overlay on the response
          this.showResponseWarning(result.warnings || []);
          break;
          
        case 'block':
          // Hide or redact the response
          this.blockResponse(result.reasons || []);
          break;
      }
    } catch (error) {
      logger.error('Error checking response:', error);
      // On error, allow response (fail open)
    } finally {
      this.isCheckingResponse = false;
    }
  }

  /**
   * Wait for check result
   */
  private waitForCheckResult(): Promise<CheckResultMessage['payload']> {
    return new Promise((resolve) => {
      let unsubscribe: (() => void) | null = null;
      
      const handler = (message: CheckResultMessage) => {
        resolve(message.payload);
        unsubscribe?.();
        return { success: true };
      };
      
      unsubscribe = this.messageBus.on('CHECK_RESULT', handler);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        unsubscribe?.();
        resolve({ action: 'allow', reasons: [], warnings: [], originalMessageId: '' });
      }, 5000);
    });
  }

  /**
   * Show warning on a response
   */
  private showResponseWarning(warnings: string[]): void {
    // Find the latest assistant message element
    const assistantMessages = document.querySelectorAll('[data-message-author-role="assistant"]');
    const latestMessage = assistantMessages[assistantMessages.length - 1];
    
    if (!latestMessage) return;

    // Check if warning already exists
    if (latestMessage.querySelector('.stinger-warning')) return;

    // Create warning element
    const warningEl = document.createElement('div');
    warningEl.className = 'stinger-warning';
    warningEl.style.cssText = `
      background-color: #FEF3C7;
      border: 1px solid #F59E0B;
      border-radius: 4px;
      padding: 12px;
      margin: 8px 0;
      font-size: 14px;
      color: #92400E;
    `;
    warningEl.innerHTML = `
      <strong>⚠️ Stinger Warning:</strong>
      <ul style="margin: 4px 0 0 20px; padding: 0;">
        ${warnings.map(w => `<li>${this.escapeHtml(w)}</li>`).join('')}
      </ul>
    `;

    // Insert at the beginning of the message
    latestMessage.insertBefore(warningEl, latestMessage.firstChild);
  }

  /**
   * Block/redact a response
   */
  private blockResponse(reasons: string[]): void {
    // Find the latest assistant message element
    const assistantMessages = document.querySelectorAll('[data-message-author-role="assistant"]');
    const latestMessage = assistantMessages[assistantMessages.length - 1];
    
    if (!latestMessage) return;

    // Find the content element
    const contentEl = latestMessage.querySelector('.markdown.prose') || 
                     latestMessage.querySelector('div[class*="markdown"]');
    
    if (!contentEl) return;

    // Replace content with blocked message
    contentEl.innerHTML = `
      <div class="stinger-blocked" style="
        background-color: #FEE;
        border: 1px solid #DC2626;
        border-radius: 4px;
        padding: 16px;
        color: #991B1B;
      ">
        <strong>🚫 Response Blocked by Stinger</strong>
        <p style="margin: 8px 0 0 0;">This response contains content that violates security policies:</p>
        <ul style="margin: 4px 0 0 20px;">
          ${reasons.map(r => `<li>${this.escapeHtml(r)}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  /**
   * Escape HTML for safe insertion
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}