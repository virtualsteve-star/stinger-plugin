import { MessageBus } from '../../extension/src/shared/messaging/MessageBus';
import type { CheckPromptMessage } from '../../extension/src/shared/types/messages';

describe('MessageBus', () => {
  let messageBus: MessageBus;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    messageBus = new MessageBus(1000); // 1 second timeout for tests
  });

  afterEach(() => {
    messageBus.destroy();
  });

  it('should register and call message handlers', async () => {
    const handler = jest.fn().mockResolvedValue({ success: true, data: 'test' });
    
    messageBus.on('CHECK_PROMPT', handler);
    
    const message: CheckPromptMessage = {
      type: 'CHECK_PROMPT',
      id: 'test-id',
      timestamp: Date.now(),
      payload: {
        text: 'test prompt',
      },
    };

    // Simulate incoming message
    const sendResponse = jest.fn();
    // Get the last call to addListener (from the current MessageBus instance)
    const calls = (chrome.runtime.onMessage.addListener as jest.Mock).mock.calls;
    const messageHandler = calls[calls.length - 1][0];
    
    // Call the message handler - it returns true to keep channel open
    const result = messageHandler(message, {}, sendResponse);
    expect(result).toBe(true); // MessageBus returns true for async handling
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(message, {});
    expect(sendResponse).toHaveBeenCalledTimes(1);
    expect(sendResponse).toHaveBeenCalledWith({ success: true, data: 'test' });
  });

  it('should handle invalid messages', async () => {
    const sendResponse = jest.fn();
    const calls = (chrome.runtime.onMessage.addListener as jest.Mock).mock.calls;
    const messageHandler = calls[calls.length - 1][0];
    
    const invalidMessage = { invalid: 'message' };
    
    await messageHandler(invalidMessage, {}, sendResponse);

    expect(sendResponse).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid message format',
    });
  });

  it('should unsubscribe handlers', () => {
    const handler = jest.fn();
    const unsubscribe = messageBus.on('CHECK_PROMPT', handler);
    
    unsubscribe();
    
    // Handler should not be called after unsubscribe
    const message: CheckPromptMessage = {
      type: 'CHECK_PROMPT',
      id: 'test-id',
      timestamp: Date.now(),
      payload: { text: 'test' },
    };

    const sendResponse = jest.fn();
    const messageHandler = (chrome.runtime.onMessage.addListener as jest.Mock).mock.calls[0][0];
    
    messageHandler(message, {}, sendResponse);

    expect(sendResponse).toHaveBeenCalledWith({
      success: false,
      error: 'No handler for message type: CHECK_PROMPT',
    });
  });
});