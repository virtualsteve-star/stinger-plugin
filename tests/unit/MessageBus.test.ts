import { MessageBus } from '../../extension/src/shared/messaging/MessageBus';
import type { 
  CheckPromptMessage, 
  CheckResponseMessage,
  CheckResultMessage,
  ContentLoadedMessage,
  StatusUpdateMessage 
} from '../../extension/src/shared/types/messages';

describe('MessageBus', () => {
  let messageBus: MessageBus;
  let mockAddListener: jest.Mock;
  let mockSendMessage: jest.Mock;
  let mockSendMessageToTab: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create fresh mocks for each test
    mockAddListener = jest.fn();
    mockSendMessage = jest.fn();
    mockSendMessageToTab = jest.fn();
    
    // Override Chrome API mocks
    (chrome.runtime.onMessage.addListener as jest.Mock) = mockAddListener;
    (chrome.runtime.sendMessage as jest.Mock) = mockSendMessage;
    (chrome.tabs.sendMessage as jest.Mock) = mockSendMessageToTab;
    
    messageBus = new MessageBus(100); // Short timeout for faster tests
  });

  afterEach(() => {
    messageBus.destroy();
  });

  describe('Message Handler Registration', () => {
    it('should register message listener on instantiation', () => {
      expect(mockAddListener).toHaveBeenCalledTimes(1);
      expect(mockAddListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should handle multiple handlers for same message type', async () => {
      const handler1 = jest.fn().mockResolvedValue({ success: true, data: 'handler1' });
      const handler2 = jest.fn().mockResolvedValue({ success: true, data: 'handler2' });
      
      messageBus.on('CHECK_PROMPT', handler1);
      messageBus.on('CHECK_PROMPT', handler2);
      
      const message: CheckPromptMessage = {
        type: 'CHECK_PROMPT',
        id: 'test-id',
        timestamp: Date.now(),
        payload: { text: 'test prompt' },
      };

      const sendResponse = jest.fn();
      const messageHandler = mockAddListener.mock.calls[0][0];
      
      const result = messageHandler(message, { tab: { id: 123 } }, sendResponse);
      expect(result).toBe(true); // Should return true for async handling
      
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(handler1).toHaveBeenCalledWith(message, { tab: { id: 123 } });
      expect(handler2).toHaveBeenCalledWith(message, { tab: { id: 123 } });
      expect(sendResponse).toHaveBeenCalledWith({ success: true, data: 'handler1' });
    });

    it('should properly unsubscribe handlers', async () => {
      const handler1 = jest.fn().mockResolvedValue({ success: true });
      const handler2 = jest.fn().mockResolvedValue({ success: true });
      
      const unsubscribe1 = messageBus.on('CHECK_PROMPT', handler1);
      messageBus.on('CHECK_PROMPT', handler2);
      
      unsubscribe1(); // Unsubscribe first handler
      
      const message: CheckPromptMessage = {
        type: 'CHECK_PROMPT',
        id: 'test-id',
        timestamp: Date.now(),
        payload: { text: 'test' },
      };

      const sendResponse = jest.fn();
      const messageHandler = mockAddListener.mock.calls[0][0];
      
      messageHandler(message, {}, sendResponse);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Message Validation', () => {
    it('should reject messages without required fields', async () => {
      const sendResponse = jest.fn();
      const messageHandler = mockAddListener.mock.calls[0][0];
      
      const invalidMessages = [
        { type: 'CHECK_PROMPT' }, // Missing id, timestamp, payload
        { id: '123', timestamp: Date.now() }, // Missing type
        { type: 'CHECK_PROMPT', id: '123', timestamp: Date.now() }, // Missing payload
        null,
        undefined,
        'string',
        123,
      ];

      for (const invalidMessage of invalidMessages) {
        jest.clearAllMocks();
        messageHandler(invalidMessage, {}, sendResponse);
        await new Promise(resolve => setTimeout(resolve, 10));
        
        expect(sendResponse).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid message format',
        });
      }
    });

    it('should validate specific message types correctly', async () => {
      const handler = jest.fn().mockResolvedValue({ success: true });
      messageBus.on('CHECK_RESULT', handler);
      
      const sendResponse = jest.fn();
      const messageHandler = mockAddListener.mock.calls[0][0];
      
      // Valid CHECK_RESULT message
      const validMessage: CheckResultMessage = {
        type: 'CHECK_RESULT',
        id: 'test-id',
        timestamp: Date.now(),
        payload: {
          action: 'allow',
          reasons: ['safe'],
          warnings: [],
          originalMessageId: 'original-id',
        },
      };
      
      messageHandler(validMessage, {}, sendResponse);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(handler).toHaveBeenCalledWith(validMessage, {});
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
      
      // Invalid CHECK_RESULT message (wrong action)
      jest.clearAllMocks();
      const invalidMessage = {
        ...validMessage,
        payload: { ...validMessage.payload, action: 'invalid-action' },
      };
      
      messageHandler(invalidMessage, {}, sendResponse);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(handler).not.toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid message format',
      });
    });
  });

  describe('Message Sending', () => {
    it('should send messages with generated id and timestamp', async () => {
      mockSendMessage.mockImplementation((message, callback) => {
        callback({ success: true, data: 'response' });
      });
      
      const result = await messageBus.send<ContentLoadedMessage>({
        type: 'CONTENT_LOADED',
        payload: {
          url: 'https://test.com',
          hostname: 'test.com',
        },
      });
      
      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'CONTENT_LOADED',
          id: expect.any(String),
          timestamp: expect.any(Number),
          payload: {
            url: 'https://test.com',
            hostname: 'test.com',
          },
        }),
        expect.any(Function)
      );
      
      expect(result).toBe('response');
    });

    it('should handle send timeout', async () => {
      // Don't call the callback - let it timeout
      mockSendMessage.mockImplementation(() => {});
      
      await expect(
        messageBus.send({
          type: 'CONTENT_LOADED',
          payload: { url: 'test', hostname: 'test' },
        })
      ).rejects.toThrow('Message timeout');
    });

    it('should handle chrome.runtime.lastError', async () => {
      chrome.runtime.lastError = { message: 'Extension context invalidated' };
      mockSendMessage.mockImplementation((message, callback) => {
        callback();
      });
      
      await expect(
        messageBus.send({
          type: 'CONTENT_LOADED',
          payload: { url: 'test', hostname: 'test' },
        })
      ).rejects.toThrow('Extension context invalidated');
      
      chrome.runtime.lastError = null;
    });

    it('should send messages to specific tabs', async () => {
      mockSendMessageToTab.mockImplementation((tabId, message, callback) => {
        expect(tabId).toBe(123);
        callback({ success: true });
      });
      
      await messageBus.sendToTab(123, {
        type: 'CHECK_RESULT',
        payload: {
          action: 'allow',
          reasons: [],
          warnings: [],
          originalMessageId: 'test',
        },
      });
      
      expect(mockSendMessageToTab).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          type: 'CHECK_RESULT',
          id: expect.any(String),
          timestamp: expect.any(Number),
        }),
        expect.any(Function)
      );
    });
  });

  describe('Error Handling', () => {
    // TODO: Issue #8 - Fix console.error spy not capturing logs
    it.skip('should handle handler errors gracefully', async () => {
      const errorHandler = jest.fn().mockRejectedValue(new Error('Handler error'));
      const successHandler = jest.fn().mockResolvedValue({ success: true, data: 'fallback' });
      
      messageBus.on('CHECK_PROMPT', errorHandler);
      messageBus.on('CHECK_PROMPT', successHandler);
      
      const message: CheckPromptMessage = {
        type: 'CHECK_PROMPT',
        id: 'test-id',
        timestamp: Date.now(),
        payload: { text: 'test' },
      };

      const sendResponse = jest.fn();
      const messageHandler = mockAddListener.mock.calls[0][0];
      
      // Mock console.error to verify it's called
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      messageHandler(message, {}, sendResponse);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(errorHandler).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith({ success: true, data: 'fallback' });
      expect(consoleError).toHaveBeenCalledWith('MessageBus error:', expect.any(Error));
      
      consoleError.mockRestore();
    });

    it('should handle missing handlers', async () => {
      const message: CheckPromptMessage = {
        type: 'CHECK_PROMPT',
        id: 'test-id',
        timestamp: Date.now(),
        payload: { text: 'test' },
      };

      const sendResponse = jest.fn();
      const messageHandler = mockAddListener.mock.calls[0][0];
      
      messageHandler(message, {}, sendResponse);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'No handler for message type: CHECK_PROMPT',
      });
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle rapid message sending', async () => {
      let callCount = 0;
      mockSendMessage.mockImplementation((message, callback) => {
        const count = ++callCount;
        setTimeout(() => callback({ success: true, data: `response-${count}` }), 5);
      });
      
      const promises = Array(10).fill(null).map((_, i) => 
        messageBus.send({
          type: 'CHECK_PROMPT',
          payload: { text: `prompt-${i}` },
        })
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      expect(mockSendMessage).toHaveBeenCalledTimes(10);
      results.forEach((result, i) => {
        expect(result).toBe(`response-${i + 1}`);
      });
    });

    // TODO: Issue #8 - Fix async cleanup timing issues  
    it.skip('should cleanup pending responses on destroy', async () => {
      // Start a send that won't complete
      mockSendMessage.mockImplementation(() => {});
      
      const sendPromise = messageBus.send({
        type: 'CONTENT_LOADED',
        payload: { url: 'test', hostname: 'test' },
      });
      
      // Destroy immediately
      messageBus.destroy();
      
      // Should timeout quickly after destroy
      await expect(sendPromise).rejects.toThrow('Message timeout');
    }, 1000); // Short timeout for this test
  });
});