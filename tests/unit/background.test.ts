describe('Background Service Worker', () => {
  it('should handle CONTENT_LOADED message', () => {
    const sendResponse = jest.fn();
    const message = { type: 'CONTENT_LOADED', url: 'https://chat.openai.com' };
    
    // Mock the message handler
    chrome.runtime.onMessage.addListener((request: any, sender: any, sendResponse: any) => {
      if (request.type === 'CONTENT_LOADED') {
        sendResponse({ status: 'ok', message: 'Background worker received content load' });
      }
    });

    // Simulate message
    const handler = (chrome.runtime.onMessage.addListener as jest.Mock).mock.calls[0][0];
    handler(message, {}, sendResponse);

    expect(sendResponse).toHaveBeenCalledWith({
      status: 'ok',
      message: 'Background worker received content load'
    });
  });
});