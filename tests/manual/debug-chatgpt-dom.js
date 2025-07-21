/**
 * Debug script to understand ChatGPT's DOM structure
 * Run this in the browser console on ChatGPT
 */

console.log('=== Debugging ChatGPT DOM Structure ===\n');

// Function to analyze an element
function analyzeElement(elem, depth = 0) {
  const indent = '  '.repeat(depth);
  const info = {
    tag: elem.tagName,
    classes: elem.className,
    id: elem.id,
    role: elem.getAttribute('role'),
    dataAttrs: Array.from(elem.attributes)
      .filter(attr => attr.name.startsWith('data-'))
      .map(attr => `${attr.name}="${attr.value}"`),
    textPreview: elem.textContent?.trim().substring(0, 50) + '...'
  };
  
  console.log(indent + '└─', info);
}

// Look for the main conversation area
console.log('1. Looking for main conversation container...');
const mainSelectors = [
  'main',
  '[role="main"]',
  '[class*="react-scroll"]',
  '[class*="conversation"]',
  'div[class*="flex"][class*="flex-col"]'
];

let conversationContainer = null;
for (const selector of mainSelectors) {
  const elem = document.querySelector(selector);
  if (elem && elem.textContent?.includes('ChatGPT')) {
    conversationContainer = elem;
    console.log(`✅ Found conversation container with selector: ${selector}`);
    analyzeElement(elem);
    break;
  }
}

if (!conversationContainer) {
  console.log('❌ Could not find conversation container');
}

// Look for message groups
console.log('\n2. Looking for message groups...');
const messageGroups = document.querySelectorAll('.group.w-full');
console.log(`Found ${messageGroups.length} message groups`);

// Analyze the last few messages
const recentMessages = Array.from(messageGroups).slice(-4);
recentMessages.forEach((group, index) => {
  console.log(`\nMessage ${index + 1}:`);
  analyzeElement(group);
  
  // Look for role indicators
  const roleIndicators = [
    { selector: '[data-message-author-role]', attr: 'data-message-author-role' },
    { selector: '[class*="user"]', type: 'user class' },
    { selector: '[class*="assistant"]', type: 'assistant class' },
    { selector: 'img[alt*="User"]', type: 'user avatar' },
    { selector: 'img[alt*="ChatGPT"]', type: 'ChatGPT avatar' }
  ];
  
  roleIndicators.forEach(({ selector, attr, type }) => {
    const elem = group.querySelector(selector);
    if (elem) {
      if (attr) {
        console.log(`  → Role: ${elem.getAttribute(attr)}`);
      } else {
        console.log(`  → Found: ${type}`);
      }
    }
  });
  
  // Check for code blocks
  const codeBlocks = group.querySelectorAll('pre code');
  if (codeBlocks.length > 0) {
    console.log(`  → Contains ${codeBlocks.length} code block(s)`);
    codeBlocks.forEach((code, i) => {
      console.log(`    Code ${i + 1}: ${code.className || 'no language class'}`);
    });
  }
});

// Look for streaming indicators
console.log('\n3. Looking for streaming indicators...');
const streamingSelectors = [
  '[class*="streaming"]',
  '[class*="cursor"]',
  '[class*="result-streaming"]',
  '.animate-pulse',
  '[class*="loading"]'
];

streamingSelectors.forEach(selector => {
  const elems = document.querySelectorAll(selector);
  if (elems.length > 0) {
    console.log(`Found ${elems.length} elements matching: ${selector}`);
  }
});

// Set up a mutation observer to catch new messages
console.log('\n4. Setting up mutation observer for new messages...');
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === 1 && node.classList?.contains('group')) {
        console.log('\n🔔 NEW MESSAGE DETECTED:');
        analyzeElement(node);
        
        // Check if it's from ChatGPT
        const isChatGPT = node.textContent?.includes('ChatGPT') || 
                         node.querySelector('[data-message-author-role="assistant"]') ||
                         node.querySelector('img[alt*="ChatGPT"]');
        
        if (isChatGPT) {
          console.log('  → This is a ChatGPT response!');
          
          // Look for code
          setTimeout(() => {
            const codeBlocks = node.querySelectorAll('pre code');
            if (codeBlocks.length > 0) {
              console.log(`  → Contains ${codeBlocks.length} code blocks after streaming`);
            }
          }, 3000); // Check after 3 seconds
        }
      }
    });
  });
});

const observeTarget = conversationContainer || document.body;
observer.observe(observeTarget, {
  childList: true,
  subtree: true
});

console.log('\n✅ Observer is running. Ask ChatGPT to write some Python code and watch the console.');