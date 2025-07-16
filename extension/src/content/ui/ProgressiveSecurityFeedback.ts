/**
 * Progressive Security Feedback Handler
 */

import type { GuardrailResult } from '../../shared/api/StingerSSEClient';
import { loggers } from '../../shared/logging/Logger';

const logger = loggers.content;

export interface SecurityFeedbackConfig {
  progressTimeout: number;
  hideDelay: number;
}

export class ProgressiveSecurityFeedback {
  private progressTimer: number | null = null;
  private hideTimer: number | null = null;
  private isProgressShown = false;
  private container: HTMLElement | null = null;
  private config: SecurityFeedbackConfig;

  constructor(config: Partial<SecurityFeedbackConfig> = {}) {
    this.config = {
      progressTimeout: 500,
      hideDelay: 2000,
      ...config,
    };
  }

  /**
   * Start security check with progress indication
   */
  startSecurityCheck(): void {
    // Removed debug log for production

    // Clear any existing timers
    this.cleanup();

    // Show progress message after configured timeout if still processing
    this.progressTimer = window.setTimeout(() => {
      this.showSecurityMessage('🛡️ Security scanning...');
    }, this.config.progressTimeout);
  }

  /**
   * Handle guardrail result
   */
  handleGuardrailResult(result: GuardrailResult): void {
    // Removed debug log for production

    if (result.performance_class === 'FAST') {
      this.showInstantResult(result);
    } else {
      this.showProgressiveResult(result);
    }
  }

  /**
   * Show instant result for FAST guardrails
   */
  private showInstantResult(result: GuardrailResult): void {
    const action = result.result.action;
    const icon = this.getActionIcon(action);
    const message = `${icon} Pattern check: ${action}`;

    this.updateSecurityMessage(message, action);

    // Auto-hide success messages quickly
    if (action === 'allow') {
      this.scheduleHide(1000);
    }
  }

  /**
   * Show progressive result for SLOW guardrails
   */
  private showProgressiveResult(result: GuardrailResult): void {
    const action = result.result.action;
    const icon = this.getActionIcon(action);
    const guardrailName = this.getGuardrailDisplayName(result.guardrail_id);
    const message = `${icon} ${guardrailName}: ${action}`;

    this.updateSecurityMessage(message, action);

    // Keep important results visible longer
    if (action === 'block') {
      this.scheduleHide(5000);
    } else if (action === 'warn') {
      this.scheduleHide(3000);
    } else {
      this.scheduleHide(2000);
    }
  }

  /**
   * Show security message
   */
  private showSecurityMessage(message: string, type: string = 'info'): void {
    if (this.isProgressShown) {
      this.updateSecurityMessage(message, type);
      return;
    }

    this.createSecurityIndicator();
    this.updateSecurityMessage(message, type);
    this.isProgressShown = true;
  }

  /**
   * Update existing security message
   */
  private updateSecurityMessage(message: string, type: string = 'info'): void {
    if (!this.container) return;

    const messageElement = this.container.querySelector('.stinger-message');
    if (messageElement) {
      messageElement.textContent = message;

      // Update styling based on type
      messageElement.className = `stinger-message stinger-${type}`;
    }
  }

  /**
   * Create security indicator UI
   */
  private createSecurityIndicator(): void {
    // Remove any existing indicator
    this.removeSecurityIndicator();

    // Create container
    this.container = document.createElement('div');
    this.container.className = 'stinger-security-indicator';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 500;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;
      pointer-events: none;
    `;

    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = 'stinger-message stinger-info';
    this.container.appendChild(messageElement);

    // Add to document
    document.body.appendChild(this.container);
  }

  /**
   * Remove security indicator
   */
  private removeSecurityIndicator(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.isProgressShown = false;
  }

  /**
   * Schedule hide with delay
   */
  private scheduleHide(delay: number): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }

    this.hideTimer = window.setTimeout(() => {
      this.hideSecurityMessage();
    }, delay);
  }

  /**
   * Hide security message
   */
  hideSecurityMessage(): void {
    if (this.container) {
      this.container.style.opacity = '0';
      this.container.style.transform = 'translateY(-10px)';

      setTimeout(() => {
        this.removeSecurityIndicator();
      }, 300);
    }
  }

  /**
   * Complete security check
   */
  completeSecurityCheck(blocked: boolean, warnings: string[] = []): void {
    // Removed debug log for production

    // Clear progress timer
    if (this.progressTimer) {
      clearTimeout(this.progressTimer);
      this.progressTimer = null;
    }

    // Show final result
    if (blocked) {
      this.showSecurityMessage('❌ Security policy violation detected', 'block');
      this.scheduleHide(5000);
    } else if (warnings.length > 0) {
      this.showSecurityMessage(`⚠️ ${warnings.length} warning(s) found`, 'warn');
      this.scheduleHide(3000);
    } else {
      this.showSecurityMessage('✅ Security check passed', 'allow');
      this.scheduleHide(2000);
    }
  }

  /**
   * Handle streaming error
   */
  handleStreamError(error: string): void {
    logger.error('Streaming error:', error);
    this.showSecurityMessage('⚠️ Security check failed - using fallback', 'error');
    this.scheduleHide(3000);
  }

  /**
   * Cleanup all timers and UI
   */
  cleanup(): void {
    if (this.progressTimer) {
      clearTimeout(this.progressTimer);
      this.progressTimer = null;
    }

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    this.hideSecurityMessage();
  }

  /**
   * Get icon for action type
   */
  private getActionIcon(action: string): string {
    switch (action) {
      case 'allow':
        return '✅';
      case 'warn':
        return '⚠️';
      case 'block':
        return '❌';
      default:
        return '🛡️';
    }
  }

  /**
   * Get display name for guardrail
   */
  private getGuardrailDisplayName(guardrailId: string): string {
    const displayNames: Record<string, string> = {
      keyword_block: 'Keyword filter',
      regex_filter: 'Pattern filter',
      url_filter: 'URL filter',
      length_filter: 'Length check',
      simple_pii_detection: 'PII detection',
      simple_toxicity_detection: 'Toxicity filter',
      ai_pii_detection: 'AI PII analysis',
      ai_toxicity_detection: 'AI toxicity analysis',
      prompt_injection: 'Injection detection',
    };

    return displayNames[guardrailId] || guardrailId;
  }
}
