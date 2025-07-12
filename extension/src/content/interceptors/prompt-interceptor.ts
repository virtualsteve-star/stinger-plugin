/**
 * Prompt Interceptor - Captures and checks prompts before submission
 */

import { MessageBus } from '../../shared/messaging/MessageBus';
import { loggers } from '../../shared/logging/Logger';
import { getPromptInput, getSubmitButton } from '../selectors/chatgpt';
import { StingerOverlay } from '../ui/overlay';
import type { CheckPromptMessage, CheckResultMessage } from '../../shared/types/messages';

const logger = loggers.content;

export class PromptInterceptor {
  private messageBus: MessageBus;
  private originalSubmitHandler: ((e: Event) => void) | null = null;
  private isCheckingPrompt = false;
  private submitButton: HTMLButtonElement | null = null;
  private promptInput: HTMLTextAreaElement | null = null;
  private overlay: StingerOverlay;

  constructor(messageBus: MessageBus) {
    this.messageBus = messageBus;
    this.overlay = new StingerOverlay();
  }

  /**
   * Start intercepting prompts
   */
  start(): void {
    logger.info('Starting prompt interception');
    
    // Set up initial interception
    this.setupInterception();
    
    // Monitor for DOM changes (ChatGPT might recreate elements)
    this.monitorForElementChanges();
  }

  /**
   * Stop intercepting
   */
  stop(): void {
    if (this.submitButton && this.originalSubmitHandler) {
      this.submitButton.removeEventListener('click', this.handleSubmitClick);
      this.submitButton.addEventListener('click', this.originalSubmitHandler);
    }
  }

  /**
   * Set up interception on current elements
   */
  private setupInterception(): void {
    this.promptInput = getPromptInput();
    this.submitButton = getSubmitButton();

    if (!this.promptInput || !this.submitButton) {
      logger.warn('Could not find prompt input or submit button');
      return;
    }

    // Intercept form submission
    this.interceptFormSubmission();
    
    // Intercept button clicks
    this.interceptButtonClick();
    
    // Intercept Enter key
    this.interceptEnterKey();
  }

  /**
   * Intercept form submission
   */
  private interceptFormSubmission(): void {
    const form = this.promptInput?.closest('form');
    if (form) {
      form.addEventListener('submit', this.handleFormSubmit, true);
    }
  }

  /**
   * Intercept button clicks
   */
  private interceptButtonClick(): void {
    if (!this.submitButton) return;

    // Remove existing listeners and add our interceptor
    const newButton = this.submitButton.cloneNode(true) as HTMLButtonElement;
    this.submitButton.parentNode?.replaceChild(newButton, this.submitButton);
    this.submitButton = newButton;
    
    this.submitButton.addEventListener('click', this.handleSubmitClick, true);
  }

  /**
   * Intercept Enter key in textarea
   */
  private interceptEnterKey(): void {
    if (!this.promptInput) return;

    this.promptInput.addEventListener('keydown', this.handleKeyDown, true);
  }

  /**
   * Handle form submission
   */
  private handleFormSubmit = async (e: Event): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();
    await this.checkAndSubmitPrompt();
  };

  /**
   * Handle submit button click
   */
  private handleSubmitClick = async (e: Event): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();
    await this.checkAndSubmitPrompt();
  };

  /**
   * Handle keydown events
   */
  private handleKeyDown = async (e: KeyboardEvent): Promise<void> => {
    // Check if Enter was pressed without Shift (Shift+Enter adds newline)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      await this.checkAndSubmitPrompt();
    }
  };

  /**
   * Check prompt and submit if allowed
   */
  private async checkAndSubmitPrompt(): Promise<void> {
    if (this.isCheckingPrompt) {
      logger.debug('Already checking prompt, ignoring');
      return;
    }

    const promptText = this.promptInput?.value.trim();
    if (!promptText) {
      logger.debug('Empty prompt, ignoring');
      return;
    }

    this.isCheckingPrompt = true;
    this.setSubmitButtonState('checking');

    try {
      logger.info('Checking prompt:', promptText.substring(0, 50) + '...');
      
      // Send prompt to background for checking
      const message: Omit<CheckPromptMessage, 'id' | 'timestamp'> = {
        type: 'CHECK_PROMPT',
        payload: {
          text: promptText,
          metadata: {
            conversationId: `session-${Date.now()}`,
            messageId: `msg-${Date.now()}`,
          },
        },
      };

      // Wait for check result
      const resultPromise = this.waitForCheckResult();
      await this.messageBus.send(message);
      const result = await resultPromise;

      logger.info('Check result:', result.action);

      // Handle the result
      switch (result.action) {
        case 'allow':
          // Submit the prompt
          this.submitPrompt();
          break;
          
        case 'warn':
          // Show warning but allow submission
          const proceed = await this.showWarning(result.warnings || []);
          if (proceed) {
            this.submitPrompt();
          }
          break;
          
        case 'block':
          // Block submission
          await this.showBlockMessage(result.reasons || []);
          // Clear the input
          if (this.promptInput) {
            this.promptInput.value = '';
          }
          break;
      }
    } catch (error) {
      logger.error('Error checking prompt:', error);
      // On error, allow submission (fail open)
      this.submitPrompt();
    } finally {
      this.isCheckingPrompt = false;
      this.setSubmitButtonState('ready');
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
   * Submit the prompt programmatically
   */
  private submitPrompt(): void {
    if (!this.promptInput || !this.submitButton) return;

    logger.debug('Submitting prompt');
    
    // Trigger native events to submit
    const inputEvent = new Event('input', { bubbles: true });
    this.promptInput.dispatchEvent(inputEvent);
    
    // Click the button
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    
    // Temporarily remove our handler
    this.submitButton.removeEventListener('click', this.handleSubmitClick, true);
    this.submitButton.dispatchEvent(clickEvent);
    // Re-add our handler
    setTimeout(() => {
      this.submitButton?.addEventListener('click', this.handleSubmitClick, true);
    }, 100);
  }

  /**
   * Set submit button state
   */
  private setSubmitButtonState(state: 'ready' | 'checking'): void {
    if (!this.submitButton) return;

    if (state === 'checking') {
      this.submitButton.disabled = true;
      this.submitButton.style.opacity = '0.5';
      this.submitButton.style.cursor = 'wait';
    } else {
      this.submitButton.disabled = false;
      this.submitButton.style.opacity = '1';
      this.submitButton.style.cursor = 'pointer';
    }
  }

  /**
   * Show warning dialog
   */
  private async showWarning(warnings: string[]): Promise<boolean> {
    return this.overlay.showWarning(warnings);
  }

  /**
   * Show block message
   */
  private async showBlockMessage(reasons: string[]): Promise<void> {
    this.overlay.showBlock(reasons);
  }

  /**
   * Monitor for element changes
   */
  private monitorForElementChanges(): void {
    // Re-check every 2 seconds in case ChatGPT recreates elements
    setInterval(() => {
      const currentInput = getPromptInput();
      const currentButton = getSubmitButton();
      
      if (currentInput !== this.promptInput || currentButton !== this.submitButton) {
        logger.debug('Elements changed, re-setting up interception');
        this.setupInterception();
      }
    }, 2000);
  }
}