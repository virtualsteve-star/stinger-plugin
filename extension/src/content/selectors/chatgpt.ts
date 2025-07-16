/**
 * DOM Selectors for ChatGPT Interface
 *
 * Note: These selectors are based on ChatGPT's current UI structure
 * and may need updates if OpenAI changes their interface
 */

export const ChatGPTSelectors = {
  // Main chat input
  promptInput: 'textarea[name="prompt-textarea"]',

  // Alternative selectors for input (ChatGPT sometimes changes these)
  alternativeInputs: [
    'textarea[placeholder*="Ask anything"]',
    'textarea[placeholder*="Send a message"]',
    'textarea[placeholder*="Message"]',
    '#prompt-textarea',
    '[contenteditable="true"]',
  ],

  // Submit button (appears when textarea has content)
  submitButton: 'button[data-testid="send-button"]',
  alternativeSubmitButtons: [
    // Primary send button patterns
    'button[aria-label*="Send"]',
    'button[aria-label="Send prompt"]',
    'button[aria-label="Send message"]',
    'button[data-testid*="send"]',
    
    // Look for the button that appears after typing
    'div[data-visible] button:has(svg)',
    'button:has(svg[data-icon="send"])',
    'button:has(path[d*="send"])',
    
    // Button that contains the send icon path (common ChatGPT send icon)
    'button:has(path[d*="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8"])',
    'button:has(path[d*="M2.01 21L23 12 2.01 3"])', // Another common send icon
    
    // Form and positioning-based selectors
    'button[type="submit"]',
    'form button:last-child',
    'div[contenteditable] ~ button:last-child',
    'div[contenteditable] + button',
    
    // Look for buttons that appear only when typing (common ChatGPT pattern)
    'button:not([disabled]):not([aria-label*="voice"]):not([aria-label*="Voice"]):not([aria-label*="attachment"]):not([aria-label*="Attachment"]):not([aria-label*="Add photos"]):not([aria-label*="files"]):not([aria-label*="upload"]):not([aria-label*="Choose"]):not([aria-label*="tool"])',
  ],

  // Message containers
  messageList: 'div[class*="flex flex-col"]',

  // Individual messages
  userMessage: '[data-message-author-role="user"]',
  assistantMessage: '[data-message-author-role="assistant"]',

  // Alternative message selectors
  alternativeMessages: {
    user: 'div.group.w-full[class*="dark:bg-gray-800"]',
    assistant: 'div.group.w-full[class*="bg-gray-50"]',
  },

  // Message content
  messageContent: '.markdown.prose',
  alternativeMessageContent: ['div[class*="markdown"]', 'div.text-base'],

  // Streaming indicator
  streamingIndicator: '.result-streaming',
  cursorBlink: '.cursor-blink',

  // Stop generation button (appears during streaming)
  stopButton: 'button:has(svg[class*="stop"])',

  // Error messages
  errorContainer: 'div[class*="error"]',

  // Model selector (GPT-4, GPT-3.5, etc.)
  modelSelector: 'button[aria-haspopup="menu"]',

  // Regenerate button
  regenerateButton: 'button:has(svg[class*="refresh"])',
} as const;

/**
 * Get the current prompt input element
 */
export function getPromptInput(): HTMLTextAreaElement | HTMLElement | null {
  // Try primary selector first
  let input = document.querySelector<HTMLTextAreaElement>(ChatGPTSelectors.promptInput);

  // Skip if it's hidden
  if (input && (input.style.display === 'none' || input.offsetParent === null)) {
    input = null;
  }

  if (!input) {
    // Try alternative selectors
    for (const selector of ChatGPTSelectors.alternativeInputs) {
      const candidate = document.querySelector<HTMLTextAreaElement>(selector);
      // Only use visible elements
      if (candidate && candidate.style.display !== 'none' && candidate.offsetParent !== null) {
        input = candidate;
        break;
      }
    }
  }

  // If still not found, try contenteditable (which is what ChatGPT actually uses!)
  if (!input) {
    const contentEditable = document.querySelector('[contenteditable="true"]');
    if (contentEditable) {
      return contentEditable as HTMLElement;
    }
  }

  // If still not found, try more generic approach
  if (!input) {
    const textareas = document.querySelectorAll('textarea');
    for (const ta of textareas) {
      const textarea = ta as HTMLTextAreaElement;
      // Only use visible textareas
      if (textarea.style.display !== 'none' && textarea.offsetParent !== null) {
        input = textarea;
        break;
      }
    }
  }

  return input;
}

/**
 * Get the submit button
 */
export function getSubmitButton(): HTMLButtonElement | null {
  let button = document.querySelector<HTMLButtonElement>(ChatGPTSelectors.submitButton);

  if (!button) {
    for (const selector of ChatGPTSelectors.alternativeSubmitButtons) {
      const candidates = document.querySelectorAll<HTMLButtonElement>(selector);
      for (const candidate of candidates) {
        const ariaLabel = candidate.getAttribute('aria-label') || '';
        // Skip buttons that are clearly not submit buttons
        if (ariaLabel.toLowerCase().includes('add photos') || 
            ariaLabel.toLowerCase().includes('files') ||
            ariaLabel.toLowerCase().includes('upload') ||
            ariaLabel.toLowerCase().includes('attachment') ||
            ariaLabel.toLowerCase().includes('voice')) {
          continue;
        }
        button = candidate;
        break;
      }
      if (button) break;
    }
  }

  // If still not found, try to find the send button that appears when typing
  if (!button) {
    // Look for buttons that might be the send button (usually has specific styling)
    const possibleButtons = document.querySelectorAll(
      'button[aria-label]:not([aria-label*="Add"]):not([aria-label*="Choose"]):not([aria-label*="voice"]):not([aria-label*="Dictate"]):not([aria-label*="photos"]):not([aria-label*="files"]):not([aria-label*="tool"])',
    );
    for (const btn of possibleButtons) {
      const ariaLabel = btn.getAttribute('aria-label') || '';
      if (ariaLabel.toLowerCase().includes('send')) {
        button = btn as HTMLButtonElement;
        break;
      }
    }
  }

  // Last resort: look for any button that's not obviously a non-send button
  if (!button) {
    const allButtons = document.querySelectorAll('button:not([disabled])');
    for (const btn of allButtons) {
      const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
      const textContent = (btn.textContent || '').toLowerCase();
      
      // Skip obvious non-send buttons
      if (ariaLabel.includes('voice') || ariaLabel.includes('attach') || 
          ariaLabel.includes('file') || ariaLabel.includes('photo') ||
          ariaLabel.includes('tool') || ariaLabel.includes('choose') ||
          ariaLabel.includes('add') || ariaLabel.includes('upload') ||
          textContent.includes('cancel') || textContent.includes('close')) {
        continue;
      }
      
      // Look for buttons that might be send buttons
      if (ariaLabel.includes('send') || textContent.includes('send') ||
          ariaLabel.includes('submit') || textContent.includes('submit') ||
          btn.querySelector('svg')) { // SVG often indicates send buttons
        button = btn as HTMLButtonElement;
        break;
      }
    }
  }

  // Debug: log what buttons we found
  if (!button) {
    console.debug('Stinger: No submit button found. Available buttons:', 
      Array.from(document.querySelectorAll('button')).map(btn => ({
        text: btn.textContent?.trim()?.substring(0, 20) || 'no text',
        ariaLabel: btn.getAttribute('aria-label') || 'no aria-label',
        dataTestId: btn.getAttribute('data-testid') || 'no data-testid',
        className: btn.className || 'no class',
        disabled: btn.disabled,
        visible: btn.offsetParent !== null
      }))
    );
  } else {
    console.debug('Stinger: Found submit button:', {
      text: button.textContent?.trim()?.substring(0, 20) || 'no text',
      ariaLabel: button.getAttribute('aria-label') || 'no aria-label',
      dataTestId: button.getAttribute('data-testid') || 'no data-testid',
      disabled: button.disabled,
      visible: button.offsetParent !== null
    });
  }

  return button;
}

/**
 * Get all messages in the conversation
 */
export function getAllMessages(): { role: 'user' | 'assistant'; content: string }[] {
  const messages: { role: 'user' | 'assistant'; content: string }[] = [];

  // Try primary selectors
  const userMessages = document.querySelectorAll(ChatGPTSelectors.userMessage);
  const assistantMessages = document.querySelectorAll(ChatGPTSelectors.assistantMessage);

  if (userMessages.length === 0 && assistantMessages.length === 0) {
    // Try alternative selectors
    // This is more complex as we need to determine role by styling
    console.warn('Using alternative message selectors');
  }

  // Combine and sort by position
  const allElements = [...Array.from(userMessages), ...Array.from(assistantMessages)];

  allElements.forEach((el) => {
    const role = el.getAttribute('data-message-author-role') as 'user' | 'assistant';
    const contentEl =
      el.querySelector(ChatGPTSelectors.messageContent) ||
      el.querySelector(ChatGPTSelectors.alternativeMessageContent[0]);

    if (contentEl) {
      messages.push({
        role,
        content: contentEl.textContent || '',
      });
    }
  });

  return messages;
}

/**
 * Check if ChatGPT is currently generating a response
 */
export function isGenerating(): boolean {
  return !!(
    document.querySelector(ChatGPTSelectors.streamingIndicator) ||
    document.querySelector(ChatGPTSelectors.cursorBlink) ||
    document.querySelector(ChatGPTSelectors.stopButton)
  );
}

/**
 * Get the latest assistant message (useful for monitoring responses)
 */
export function getLatestAssistantMessage(): string | null {
  const messages = document.querySelectorAll(ChatGPTSelectors.assistantMessage);
  const latestMessage = messages[messages.length - 1];

  if (!latestMessage) return null;

  const contentEl = latestMessage.querySelector(ChatGPTSelectors.messageContent);
  return contentEl?.textContent || null;
}
