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
  private promptInput: HTMLTextAreaElement | HTMLElement | null = null;
  private overlay: StingerOverlay;
  private interceptedElements = new WeakSet<Element>();
  private lastKnownValue = '';

  constructor(messageBus: MessageBus) {
    this.messageBus = messageBus;
    this.overlay = new StingerOverlay();
  }

  /**
   * Get value from either textarea or contenteditable element
   */
  private getInputValue(element: HTMLTextAreaElement | HTMLElement | null): string {
    if (!element) return '';
    
    // For textarea
    if ('value' in element) {
      return element.value;
    }
    
    // For contenteditable
    return element.textContent || '';
  }

  /**
   * Set value for either textarea or contenteditable element
   */
  private setInputValue(element: HTMLTextAreaElement | HTMLElement | null, value: string): void {
    if (!element) return;
    
    // For textarea
    if ('value' in element) {
      element.value = value;
    } else {
      // For contenteditable
      element.textContent = value;
    }
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
    
    // Also monitor for input changes (submit button appears when typing)
    this.monitorForInputChanges();
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
    const oldInput = this.promptInput;
    this.promptInput = getPromptInput();
    this.submitButton = getSubmitButton();

    if (!this.promptInput) {
      logger.warn('Could not find prompt input');
      return;
    }

    logger.debug('Found prompt input:', {
      selector: this.promptInput.name || this.promptInput.placeholder,
      hasButton: !!this.submitButton
    });

    // Always set up fresh monitoring when input changes
    if (oldInput !== this.promptInput) {
      // Remove from tracked elements so monitoring gets set up again
      if (oldInput) {
        this.interceptedElements.delete(oldInput);
      }
    }

    // Set up input monitoring to track value changes
    this.setupInputMonitoring();

    // Intercept form submission
    this.interceptFormSubmission();
    
    // Intercept button clicks if button found (including voice button that turns into submit)
    if (this.submitButton) {
      this.interceptButtonClick();
    } else {
      // Try to intercept the voice button that will become submit button
      const voiceButton = document.querySelector('button[aria-label="Start voice mode"]');
      if (voiceButton) {
        logger.debug('Found voice button, will monitor for transformation');
      }
    }
    
    // Intercept Enter key - this is the primary submission method
    this.interceptEnterKey();
  }

  /**
   * Intercept form submission
   */
  private interceptFormSubmission(): void {
    const form = this.promptInput?.closest('form');
    if (form) {
      // Listen to submit event
      form.addEventListener('submit', this.handleFormSubmit, true);
    }
  }

  /**
   * Intercept button clicks
   */
  private interceptButtonClick(): void {
    if (!this.submitButton) return;

    // Check if we already added a listener to this button
    if (this.interceptedElements.has(this.submitButton)) {
      logger.debug('Submit button already has click listener');
      return;
    }

    logger.debug('Adding click listener to submit button');
    
    // Capture value on mouseover - before click!
    this.submitButton!.addEventListener('mouseover', () => {
      const input = getPromptInput();
      const value = this.getInputValue(input);
      if (input && value) {
        this.lastKnownValue = value;
      }
    }, true);
    
    // Simple click listener - the value will be captured by mouseover
    this.submitButton.addEventListener('click', this.handleSubmitClick, true);
    
    // Mark that we've added a listener (using WeakSet instead of DOM attribute)
    this.interceptedElements.add(this.submitButton);
  }

  /**
   * Intercept Enter key in textarea
   */
  private interceptEnterKey(): void {
    if (!this.promptInput) return;

    // Check if we already added a listener to this input
    if (this.interceptedElements.has(this.promptInput)) {
      logger.debug('Prompt input already has keydown listener');
      return;
    }

    logger.info('Adding keydown listener to prompt input');
    this.promptInput.addEventListener('keydown', this.handleKeyDown, true);
    
    // Mark that we've added a listener (using WeakSet instead of DOM attribute)
    this.interceptedElements.add(this.promptInput);
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
  private handleSubmitClick = (e: Event): void => {
    logger.debug('Submit button clicked - intercepting');
    
    // Only handle if not already prevented
    if (e.defaultPrevented) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    // Run the check
    this.checkAndSubmitPrompt().catch(error => {
      logger.error('Error in checkAndSubmitPrompt:', error);
    });
  };

  /**
   * Handle keydown events
   */
  private handleKeyDown = async (e: KeyboardEvent): Promise<void> => {
    // Log all keydown events for debugging
    if (e.key === 'Enter') {
      logger.info(`Enter key detected - Shift: ${e.shiftKey}, Target: ${(e.target as HTMLElement).tagName}`);
    }
    
    // Check if Enter was pressed without Shift (Shift+Enter adds newline)
    if (e.key === 'Enter' && !e.shiftKey) {
      logger.info('Enter key pressed - intercepting submission!');
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation(); // Stop all other handlers
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

    if (!this.promptInput) {
      logger.error('Prompt input not found');
      return;
    }

    // Get fresh reference to ensure we have the right element
    const currentInput = getPromptInput();
    
    // Try to get value
    let promptText = '';
    const inputToCheck = currentInput || this.promptInput;
    
    if (inputToCheck) {
      // First try regular value
      promptText = this.getInputValue(inputToCheck).trim();
      
      // If empty, try our last known value
      if (!promptText && this.lastKnownValue) {
        promptText = this.lastKnownValue.trim();
      }
    }
    
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
            this.setInputValue(this.promptInput, '');
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
    if (!this.promptInput) return;

    logger.debug('Submitting prompt programmatically');
    
    // Temporarily remove our Enter key handler to avoid recursion
    this.promptInput.removeEventListener('keydown', this.handleKeyDown, true);
    
    // Simulate Enter key press (the most common way to submit)
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
      view: window,
    });
    
    // Dispatch the event
    this.promptInput.dispatchEvent(enterEvent);
    
    // For some React apps, we might need to trigger keypress too
    const keypressEvent = new KeyboardEvent('keypress', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
      view: window,
    });
    this.promptInput.dispatchEvent(keypressEvent);
    
    // Re-add our handler after a short delay
    setTimeout(() => {
      if (this.promptInput) {
        this.promptInput.addEventListener('keydown', this.handleKeyDown, true);
      }
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
    // Use MutationObserver for better performance
    const observer = new MutationObserver(() => {
      const currentInput = getPromptInput();
      const currentButton = getSubmitButton();
      
      if (currentInput !== this.promptInput || currentButton !== this.submitButton) {
        logger.debug('Elements changed, re-setting up interception');
        this.setupInterception();
      }
    });
    
    // Observe the main content area
    const mainContent = document.querySelector('main') || document.body;
    observer.observe(mainContent, {
      childList: true,
      subtree: true,
      attributes: false
    });
    
    // Also check periodically as backup
    setInterval(() => {
      const currentInput = getPromptInput();
      const currentButton = getSubmitButton();
      
      if (currentInput !== this.promptInput || currentButton !== this.submitButton) {
        logger.debug('Elements changed (interval check), re-setting up interception');
        this.setupInterception();
      }
    }, 2000);
  }
  
  /**
   * Set up input monitoring to track value changes
   */
  private setupInputMonitoring(): void {
    if (!this.promptInput) return;
    
    // Don't set up monitoring twice for the same element
    if (this.interceptedElements.has(this.promptInput)) {
      return;
    }
    
    // Simple approach - just capture on input event
    const captureValue = (e: Event) => {
      const target = e.target as HTMLTextAreaElement | HTMLElement;
      const value = this.getInputValue(target);
      if (value) {
        this.lastKnownValue = value;
      }
    };
    
    // Only monitor input event - that's sufficient
    this.promptInput.addEventListener('input', captureValue, true);
    
    // Mark this input as monitored
    this.interceptedElements.add(this.promptInput);
  }
  
  
  /**
   * Monitor for input changes to detect when submit button appears
   */
  private monitorForInputChanges(): void {
    if (!this.promptInput) return;
    
    // Check if we need to re-setup button interception
    this.promptInput.addEventListener('input', () => {
      if (!this.submitButton || !this.interceptedElements.has(this.submitButton)) {
        const newButton = getSubmitButton();
        if (newButton && newButton !== this.submitButton) {
          logger.debug('Submit button appeared, setting up interception');
          this.submitButton = newButton;
          this.interceptButtonClick();
        }
      }
    });
  }
}