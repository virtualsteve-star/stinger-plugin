// Content script for ChatGPT
console.log('Stinger Guard: Content script loaded on', window.location.href);

// Basic message to test communication
chrome.runtime.sendMessage({ type: 'CONTENT_LOADED', url: window.location.href }, (response) => {
  console.log('Stinger Guard: Background response:', response);
});

// Placeholder for prompt interception
function initializeStingerGuard() {
  console.log('Stinger Guard: Initializing...');
  // TODO: Implement prompt interception
  // TODO: Implement response monitoring
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeStingerGuard);
} else {
  initializeStingerGuard();
}