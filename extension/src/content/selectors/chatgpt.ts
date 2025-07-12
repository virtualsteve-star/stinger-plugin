/**
 * DOM Selectors for ChatGPT Interface
 * 
 * Note: These selectors are based on ChatGPT's current UI structure
 * and may need updates if OpenAI changes their interface
 */

export const ChatGPTSelectors = {
  // Main chat input
  promptInput: 'textarea[data-id="root"]',
  
  // Alternative selectors for input (ChatGPT sometimes changes these)
  alternativeInputs: [
    'textarea[placeholder*="Send a message"]',
    'textarea[placeholder*="Message"]',
    '#prompt-textarea'
  ],
  
  // Submit button
  submitButton: 'button[data-testid="send-button"]',
  alternativeSubmitButtons: [
    'button[aria-label*="Send"]',
    'button svg.w-4.h-4', // Sometimes the button just has an SVG
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
  alternativeMessageContent: [
    'div[class*="markdown"]',
    'div.text-base',
  ],
  
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
export function getPromptInput(): HTMLTextAreaElement | null {
  // Try primary selector first
  let input = document.querySelector<HTMLTextAreaElement>(ChatGPTSelectors.promptInput);
  
  if (!input) {
    // Try alternative selectors
    for (const selector of ChatGPTSelectors.alternativeInputs) {
      input = document.querySelector<HTMLTextAreaElement>(selector);
      if (input) break;
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
      button = document.querySelector<HTMLButtonElement>(selector);
      if (button) break;
    }
  }
  
  return button;
}

/**
 * Get all messages in the conversation
 */
export function getAllMessages(): { role: 'user' | 'assistant', content: string }[] {
  const messages: { role: 'user' | 'assistant', content: string }[] = [];
  
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
  
  allElements.forEach(el => {
    const role = el.getAttribute('data-message-author-role') as 'user' | 'assistant';
    const contentEl = el.querySelector(ChatGPTSelectors.messageContent) || 
                     el.querySelector(ChatGPTSelectors.alternativeMessageContent[0]);
    
    if (contentEl) {
      messages.push({
        role,
        content: contentEl.textContent || ''
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