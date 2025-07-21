/**
 * Test script to debug response detection issues
 */

// Test 1: Check if assistant messages are being detected
console.log('=== Testing Assistant Message Detection ===');

// Look for various selectors that might contain assistant messages
const selectors = [
  '[data-message-author-role="assistant"]',
  '[class*="assistant"]',
  '[class*="message"][class*="bot"]',
  '[class*="response"]',
  'div[class*="markdown"]',
  'article',
  '[data-testid*="conversation"]',
  '.group:has(.text-token-text-primary)',
  '.group.w-full',
  '[class*="ConversationItem"]'
];

console.log('Searching for assistant messages with selectors:');
selectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  if (elements.length > 0) {
    console.log(`✅ Found ${elements.length} elements with selector: ${selector}`);
    // Log first element's structure
    if (elements[0]) {
      console.log('  Sample element:', {
        className: elements[0].className,
        tagName: elements[0].tagName,
        textPreview: elements[0].textContent?.substring(0, 100) + '...',
        hasCode: elements[0].querySelector('code') !== null
      });
    }
  }
});

// Test 2: Check for code blocks specifically
console.log('\n=== Testing Code Block Detection ===');
const codeSelectors = [
  'pre code',
  'code',
  '[class*="code"]',
  '.highlight',
  '.language-python',
  '[data-language="python"]'
];

codeSelectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  if (elements.length > 0) {
    console.log(`✅ Found ${elements.length} code blocks with selector: ${selector}`);
  }
});

// Test 3: Look at the actual DOM structure
console.log('\n=== Current DOM Structure ===');
const mainContent = document.querySelector('main') || document.querySelector('[role="main"]');
if (mainContent) {
  console.log('Main content found. Looking for conversation structure...');
  
  // Try to find conversation turns
  const conversationElements = mainContent.querySelectorAll('.group.w-full');
  console.log(`Found ${conversationElements.length} conversation elements`);
  
  conversationElements.forEach((elem, index) => {
    const isUser = elem.textContent?.includes('You') || elem.querySelector('[data-message-author-role="user"]');
    const isAssistant = elem.textContent?.includes('ChatGPT') || elem.querySelector('[data-message-author-role="assistant"]');
    const hasCode = elem.querySelector('pre code') !== null;
    
    console.log(`Turn ${index + 1}:`, {
      type: isUser ? 'User' : isAssistant ? 'Assistant' : 'Unknown',
      hasCode,
      textPreview: elem.textContent?.substring(0, 80) + '...'
    });
  });
}

// Test 4: Monitor for new messages
console.log('\n=== Setting up Mutation Observer ===');
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === 1) { // Element node
        const element = node;
        const text = element.textContent || '';
        
        // Check if it's an assistant message
        if (text.includes('ChatGPT') || 
            element.querySelector('[data-message-author-role="assistant"]') ||
            element.className.includes('assistant')) {
          console.log('🔔 New assistant message detected:', {
            className: element.className,
            hasCode: element.querySelector('code') !== null,
            textPreview: text.substring(0, 100) + '...'
          });
        }
        
        // Check for code blocks
        const codeBlocks = element.querySelectorAll('pre code');
        if (codeBlocks.length > 0) {
          console.log('🔔 New code block detected:', {
            count: codeBlocks.length,
            language: codeBlocks[0].className
          });
        }
      }
    });
  });
});

// Observe the main content area
if (mainContent) {
  observer.observe(mainContent, {
    childList: true,
    subtree: true
  });
  console.log('Mutation observer started. Try asking ChatGPT to generate some code...');
} else {
  console.error('Could not find main content area to observe');
}

// Test 5: Check if our response interceptor is actually running
console.log('\n=== Checking Extension Status ===');
if (window.stingerResponseInterceptor) {
  console.log('✅ Response interceptor is loaded');
} else {
  console.log('❌ Response interceptor not found in window object');
}

// Look for Stinger-specific classes
const stingerElements = document.querySelectorAll('[class*="stinger"]');
console.log(`Found ${stingerElements.length} elements with Stinger classes`);

// Instructions for testing
console.log('\n=== Test Instructions ===');
console.log('1. Ask ChatGPT: "Write a Python function to calculate factorial"');
console.log('2. Watch the console for detection messages');
console.log('3. Check if any security warnings appear');
console.log('4. Look for any blocked or warned content indicators');