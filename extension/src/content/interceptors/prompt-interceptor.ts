/**
 * Prompt Interceptor - Captures and checks prompts before submission
 */

import { MessageBus } from '../../shared/messaging/MessageBus';
import { loggers } from '../../shared/logging/Logger';
import { getPromptInput, getSubmitButton } from '../selectors/chatgpt';
import { StingerOverlay } from '../ui/overlay';
import { ProgressiveSecurityFeedback } from '../ui/ProgressiveSecurityFeedback';
import { StingerSSEClient } from '../../shared/api/StingerSSEClient';
import { conversationManager } from '../utils/conversation-manager';
import { stingerClientV2 } from '../../shared/api/StingerClientV2';
import { UI_CONFIG, SECURITY_CONFIG } from '../../shared/constants';
import type { CheckPromptMessage, CheckResultMessage } from '../../shared/types/messages';

const logger = loggers.content;

export class PromptInterceptor {
  private messageBus: MessageBus;
  private originalSubmitHandler: ((e: Event) => void) | null = null;
  private isCheckingPrompt = false;
  private submitButton: HTMLButtonElement | null = null;
  private promptInput: HTMLTextAreaElement | HTMLElement | null = null;
  private overlay: StingerOverlay;
  private progressFeedback: ProgressiveSecurityFeedback;
  private sseClient: StingerSSEClient;
  private interceptedElements = new WeakSet<Element>();
  private usePhase15API = true;
  private lastKnownValue = '';
  private intervalId: number | null = null;
  private mutationObserver: MutationObserver | null = null;
  private streamingEnabled = true;

  constructor(messageBus: MessageBus) {
    this.messageBus = messageBus;
    this.overlay = new StingerOverlay();
    this.progressFeedback = new ProgressiveSecurityFeedback();
    this.sseClient = new StingerSSEClient();
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
    // Removed info log for production

    // Set up initial interception with retries
    this.setupInterceptionWithRetries();

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

    // Clean up interval
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Clean up mutation observer
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    // Clean up progress feedback
    this.progressFeedback.cleanup();
  }

  /**
   * Enable or disable streaming mode
   */
  setStreamingEnabled(enabled: boolean): void {
    this.streamingEnabled = enabled;
    // Removed info log for production
  }

  /**
   * Set up interception with retries
   */
  private setupInterceptionWithRetries(): void {
    let attempts = 0;
    const maxAttempts = 10;

    const trySetup = () => {
      attempts++;
      // Removed debug log for production

      this.setupInterception();

      // Log what we found
      // Removed info log for production

      // If we didn't find the input, try again
      if (!this.promptInput && attempts < maxAttempts) {
        // Removed debug log for production
        setTimeout(trySetup, 1000);
      } else if (!this.promptInput) {
        logger.error('Failed to find prompt input after maximum attempts');
      }
    };

    trySetup();
  }

  /**
   * Set up interception on current elements
   */
  private setupInterception(): void {
    const oldInput = this.promptInput;
    this.promptInput = getPromptInput();
    this.submitButton = getSubmitButton();
    
    // Removed debug log for production

    if (!this.promptInput) {
      logger.warn('Could not find prompt input');
      // Log what elements we do find for debugging
      // Removed debug logs for production
      return;
    }

    // Removed debug log for production

    // Always set up fresh monitoring when input changes
    if (oldInput !== this.promptInput) {
      // Remove from tracked elements so monitoring gets set up again
      if (oldInput) {
        this.interceptedElements.delete(oldInput);
      }
    }

    // Intercept Enter key - this is the primary submission method
    this.interceptEnterKey();
  }

  /**
   * Intercept form submission
   */
  /* private interceptFormSubmission(): void {
    const form = this.promptInput?.closest('form');
    if (form) {
      // Listen to submit event
      form.addEventListener('submit', this.handleFormSubmit, true);
    }
  } */

  /**
   * Intercept button clicks
   */
  private interceptButtonClick(): void {
    if (!this.submitButton) return;

    // Check if we already added a listener to this button
    if (this.interceptedElements.has(this.submitButton)) {
      // Removed debug log for production
      return;
    }

    // Removed debug log for production

    // Capture value on mouseover - before click!
    this.submitButton!.addEventListener(
      'mouseover',
      () => {
        const input = getPromptInput();
        const value = this.getInputValue(input);
        if (input && value) {
          this.lastKnownValue = value;
        }
      },
      true,
    );

    // Multiple event listeners to ensure interception
    this.submitButton.addEventListener('click', this.handleSubmitClick, true);
    this.submitButton.addEventListener('mousedown', this.handleSubmitClick, true);
    this.submitButton.addEventListener('pointerdown', this.handleSubmitClick, true);

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
      // Removed debug log for production
      return;
    }

    // Removed debug log for production

    // Simple keydown listener on the input element
    this.promptInput.addEventListener('keydown', this.handleKeyDown, true);

    // Mark that we've added a listener (using WeakSet instead of DOM attribute)
    this.interceptedElements.add(this.promptInput);
  }

  /**
   * Handle form submission
   */
  /* private handleFormSubmit = async (e: Event): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();
    await this.checkAndSubmitPrompt();
  }; */

  /**
   * Handle submit button click
   */
  private handleSubmitClick = (e: Event): void => {
    // Removed debug log for production

    // Only handle if not already prevented
    if (e.defaultPrevented) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Run the check
    this.checkAndSubmitPrompt().catch((error) => {
      logger.error('Error in checkAndSubmitPrompt:', error);
    });
  };

  /**
   * Handle button click detected via mouseover
   */
  private handleMouseoverButtonClick = (e: Event): void => {
    // Removed debug log for production

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    // Run the check
    this.checkAndSubmitPrompt().catch((error) => {
      logger.error('Error in checkAndSubmitPrompt:', error);
    });
  };

  /**
   * Handle keydown events
   */
  private handleKeyDown = async (e: Event): Promise<void> => {
    const keyEvent = e as KeyboardEvent;

    // Check if Enter was pressed without Shift (Shift+Enter adds newline)
    if (keyEvent.key === 'Enter' && !keyEvent.shiftKey) {
      // Removed debug log for production
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
      // Removed debug log for production
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
      // Removed debug log for production
      return;
    }

    this.isCheckingPrompt = true;
    this.setSubmitButtonState('checking');

    try {
      // Removed info log for production

      // Use Phase 15 API if enabled
      if (this.usePhase15API) {
        await this.analyzeWithPhase15(promptText);
      } else if (this.streamingEnabled && StingerSSEClient.isSupported()) {
        await this.analyzeWithStreaming(promptText);
      } else {
        await this.analyzeWithBatch(promptText);
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
   * Analyze with Phase 15 API
   */
  private async analyzeWithPhase15(promptText: string): Promise<void> {
    try {
      // Removed info log for production

      // Check input with default mode (full protection)
      // Record prompt in conversation manager
      await conversationManager.recordPrompt(promptText);
      const context = await conversationManager.getApiContext();
      
      // Check input with API
      const result = await stingerClientV2.checkInput(promptText, context);

      // Handle result
      this.handleAnalysisResult(result.action === 'block', result.warnings, result.reasons);
    } catch (error) {
      logger.error('Phase 15 API error:', error);
      // Fail open - allow submission
      this.submitPrompt();
    }
  }

  /**
   * Analyze with streaming SSE
   */
  private async analyzeWithStreaming(promptText: string): Promise<void> {
    try {
      // Removed info log for production

      // Start progress indication
      this.progressFeedback.startSecurityCheck();

      // Perform streaming analysis
      const result = await this.sseClient.analyzeWithStreaming(promptText);

      // Process guardrail results progressively
      for (const guardrailResult of result.guardrailResults) {
        this.progressFeedback.handleGuardrailResult(guardrailResult);
      }

      // Complete security check
      this.progressFeedback.completeSecurityCheck(result.blocked, result.warnings);

      // Handle final result
      this.handleAnalysisResult(result.blocked, result.warnings, result.reasons);
    } catch (error) {
      logger.warn('Streaming analysis failed, falling back to batch:', error);
      this.progressFeedback.handleStreamError(
        error instanceof Error ? error.message : 'Unknown error',
      );

      // Fallback to batch mode
      await this.analyzeWithBatch(promptText);
    }
  }

  /**
   * Analyze with batch API (fallback)
   */
  private async analyzeWithBatch(promptText: string): Promise<void> {
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

    // Removed info log for production

    // Handle the result
    const blocked = result.action === 'block';
    const warnings = result.warnings || [];
    const reasons = result.reasons || [];

    this.handleAnalysisResult(blocked, warnings, reasons);
  }

  /**
   * Handle analysis result (both streaming and batch)
   */
  private async handleAnalysisResult(
    blocked: boolean,
    warnings: string[],
    reasons: string[],
  ): Promise<void> {
    if (blocked) {
      // Block submission
      await this.showBlockMessage(reasons);
      // Clear the input
      if (this.promptInput) {
        this.setInputValue(this.promptInput, '');
      }
    } else if (warnings.length > 0) {
      // Show warning but allow submission
      const proceed = await this.showWarning(warnings);
      if (proceed) {
        this.submitPrompt();
      }
    } else {
      // Allow submission
      this.submitPrompt();
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

      // Timeout after configured time
      setTimeout(() => {
        unsubscribe?.();
        resolve({ action: 'allow', reasons: [], warnings: [], originalMessageId: '' });
      }, SECURITY_CONFIG.PROMPT_CHECK_TIMEOUT);
    });
  }

  /**
   * Submit the prompt programmatically
   */
  private submitPrompt(): void {
    if (!this.promptInput) return;

    // Removed debug log for production

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
    }, UI_CONFIG.BUTTON_CLICK_DELAY);
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
   * Monitor for element changes - with detailed button tracking
   */
  private monitorForElementChanges(): void {
    // Clean up existing observers
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }

    // Use MutationObserver for better performance
    this.mutationObserver = new MutationObserver(() => {
      const currentInput = getPromptInput();
      const currentButton = getSubmitButton();

      if (currentInput !== this.promptInput || currentButton !== this.submitButton) {
        // Removed debug log for production
        this.setupInterception();
      }
    });

    // Observe the main content area
    const mainContent = document.querySelector('main') || document.body;
    this.mutationObserver.observe(mainContent, {
      childList: true,
      subtree: true,
      attributes: true, // Watch for attribute changes too
    });

    // Detailed button monitoring loop
    this.intervalId = window.setInterval(() => {
      this.trackButtonChanges();
    }, 200); // Check every 200ms for detailed tracking

    // Add mouse event tracking for button hover detection
    this.setupMouseTracking();
  }

  /**
   * Track button changes in detail
   */
  private trackButtonChanges(): void {
    // Find all buttons in the input area
    const inputContainer =
      this.promptInput?.closest('[data-testid="composer-background"]') ||
      this.promptInput?.closest('form') ||
      this.promptInput?.parentElement;

    if (!inputContainer) return;

    const buttons = inputContainer.querySelectorAll('button');
    const buttonInfo = Array.from(buttons).map((btn) => ({
      text: btn.textContent?.trim() || '',
      ariaLabel: btn.getAttribute('aria-label') || '',
      dataTestId: btn.getAttribute('data-testid') || '',
      disabled: btn.disabled,
      visible: btn.offsetParent !== null,
      classes: btn.className,
      hasHover: btn.matches(':hover'),
      hasFocus: btn.matches(':focus'),
      innerHTML: btn.innerHTML.substring(0, 100), // First 100 chars of HTML
    }));

    // Log button changes
    const buttonSnapshot = JSON.stringify(buttonInfo);
    if (buttonSnapshot !== (this as any).lastButtonSnapshot) {
      (this as any).lastButtonSnapshot = buttonSnapshot;

      // Check for the actual send button
      const sendButton = Array.from(buttons).find((btn) => {
        const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
        const text = btn.textContent?.toLowerCase() || '';
        return (
          ariaLabel.includes('send') ||
          text.includes('send') ||
          btn.getAttribute('data-testid') === 'send-button'
        );
      });

      if (sendButton && sendButton !== this.submitButton) {
        // Removed debug log for production
        this.submitButton = sendButton as HTMLButtonElement;
        this.interceptButtonClick();

        // Also add direct click listener to this specific button
        sendButton.addEventListener(
          'click',
          (e) => {
            // Removed debug log for production
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.checkAndSubmitPrompt();
          },
          true,
        );
      }
    }
  }

  /**
   * Set up mouse tracking for button hover detection
   */
  private setupMouseTracking(): void {
    // Track mouse events on the entire input container
    const inputContainer =
      this.promptInput?.closest('[data-testid="composer-background"]') ||
      this.promptInput?.closest('form') ||
      this.promptInput?.parentElement;

    if (!inputContainer) return;

    // Add mouse event listeners
    inputContainer.addEventListener('mouseover', (e) => {
      if (e.target instanceof HTMLButtonElement) {
        // If this is a send button, add click listener directly
        const ariaLabel = e.target.getAttribute('aria-label')?.toLowerCase() || '';
        if (ariaLabel.includes('send') || e.target.getAttribute('data-testid') === 'send-button') {
          // Removed debug log for production

          // Remove any existing listener first
          e.target.removeEventListener('click', this.handleMouseoverButtonClick);

          // Add new listener
          e.target.addEventListener('click', this.handleMouseoverButtonClick, true);
        }
      }
    });

    inputContainer.addEventListener(
      'click',
      (e) => {
        if (e.target instanceof HTMLButtonElement) {
          // Check if this could be the send button
          const ariaLabel = e.target.getAttribute('aria-label')?.toLowerCase() || '';
          const text = e.target.textContent?.toLowerCase() || '';
          if (
            ariaLabel.includes('send') ||
            text.includes('send') ||
            e.target.getAttribute('data-testid') === 'send-button'
          ) {
            // Removed debug log for production
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.checkAndSubmitPrompt();
          }
        }
      },
      true,
    ); // Use capture phase
  }

  /**
   * Set up input monitoring to track value changes
   */
  /* private setupInputMonitoring(): void {
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

    // Monitor multiple input events
    this.promptInput.addEventListener('input', captureValue, true);
    this.promptInput.addEventListener('textInput', captureValue, true);
    this.promptInput.addEventListener('paste', captureValue, true);
    
    // Use MutationObserver to detect content changes
    const observer = new MutationObserver(() => {
      const value = this.getInputValue(this.promptInput);
      if (value && value !== this.lastKnownValue) {
        this.lastKnownValue = value;
      }
    });
    
    observer.observe(this.promptInput, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // Mark this input as monitored
    this.interceptedElements.add(this.promptInput);
  } */

  /**
   * Monitor for input changes to detect when submit button appears
   */
  private monitorForInputChanges(): void {
    if (!this.promptInput) return;

    // Check if we need to re-setup button interception
    this.promptInput.addEventListener('input', () => {
      const newButton = getSubmitButton();
      if (newButton && newButton !== this.submitButton) {
        this.submitButton = newButton;
        this.interceptButtonClick();
      }
    });

    // Also check on focus - ChatGPT might show the button when focused
    this.promptInput.addEventListener('focus', () => {
      const newButton = getSubmitButton();
      if (newButton && newButton !== this.submitButton) {
        this.submitButton = newButton;
        this.interceptButtonClick();
      }
    });
  }
}
