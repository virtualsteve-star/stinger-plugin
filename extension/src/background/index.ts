// Background service worker
console.log('Stinger Guard: Background service worker started');

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Stinger Guard: Received message:', request, 'from:', sender.tab?.url);
  
  switch (request.type) {
    case 'CONTENT_LOADED':
      sendResponse({ status: 'ok', message: 'Background worker received content load' });
      break;
      
    case 'CHECK_PROMPT':
      // TODO: Implement API call to Stinger
      sendResponse({ action: 'allow', message: 'API integration pending' });
      break;
      
    default:
      sendResponse({ status: 'error', message: 'Unknown message type' });
  }
  
  return true; // Keep message channel open for async response
});

// Log when extension is installed or updated
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Stinger Guard: Extension installed/updated', details);
});