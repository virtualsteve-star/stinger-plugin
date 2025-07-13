import { MessageBus } from '../../extension/src/shared/messaging/MessageBus';
import { storageService } from '../../extension/src/shared/storage/StorageService';
import { stingerClient } from '../../extension/src/shared/api/StingerClient';
import { loggers } from '../../extension/src/shared/logging/Logger';
import type {
  ContentLoadedMessage,
  CheckPromptMessage,
  CheckResponseMessage,
  CheckResultMessage,
} from '../../extension/src/shared/types/messages';
import type { CheckRequest, CheckResponse } from '../../extension/src/shared/types/api';

// Mock dependencies
jest.mock('../../extension/src/shared/messaging/MessageBus');
jest.mock('../../extension/src/shared/storage/StorageService');
jest.mock('../../extension/src/shared/api/StingerClient');
jest.mock('../../extension/src/shared/logging/Logger');

// TODO: Issue #8 - Fix MessageBus constructor mocking issues  
describe.skip('Background Service Worker', () => {
  let mockMessageBus: jest.Mocked<MessageBus>;
  let mockStorageService: jest.Mocked<typeof storageService>;
  let mockStingerClient: jest.Mocked<typeof stingerClient>;
  let mockLogger: any;
  
  // Handler functions we'll capture
  let contentLoadedHandler: any;
  let checkPromptHandler: any;
  let checkResponseHandler: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Reset handlers
    contentLoadedHandler = undefined;
    checkPromptHandler = undefined;
    checkResponseHandler = undefined;
    
    // Setup logger mock
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    (loggers as any).background = mockLogger;
    
    // Setup MessageBus mock
    mockMessageBus = {
      on: jest.fn((type, handler) => {
        console.log(`Registering handler for ${type}`);
        if (type === 'CONTENT_LOADED') contentLoadedHandler = handler;
        if (type === 'CHECK_PROMPT') checkPromptHandler = handler;
        if (type === 'CHECK_RESPONSE') checkResponseHandler = handler;
        return () => {};
      }),
      send: jest.fn(),
      sendToTab: jest.fn(),
      destroy: jest.fn(),
    } as any;
    (MessageBus as jest.Mock).mockImplementation(() => {
      // Log when MessageBus is instantiated
      console.log('MessageBus instantiated');
      return mockMessageBus;
    });
    
    // Setup storage service mock
    mockStorageService = {
      initialize: jest.fn().mockResolvedValue(undefined),
      getConfig: jest.fn().mockResolvedValue({
        apiUrl: 'http://localhost:8888',
        apiTimeout: 2000,
        debugMode: false,
        logLevel: 'info',
      }),
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      getBytesInUse: jest.fn(),
    } as any;
    Object.assign(storageService, mockStorageService);
    
    // Setup Stinger client mock
    mockStingerClient = {
      updateConfig: jest.fn(),
      health: jest.fn().mockResolvedValue({ success: true, data: { status: 'healthy' } }),
      getRules: jest.fn().mockResolvedValue({ 
        success: true, 
        data: { 
          version: '1.0.0', 
          preset: 'standard',
          guardrails: { input_guardrails: {}, output_guardrails: {} }
        } 
      }),
      checkContent: jest.fn().mockResolvedValue({
        success: true,
        data: {
          action: 'allow',
          reasons: [],
          warnings: [],
        }
      }),
    } as any;
    Object.assign(stingerClient, mockStingerClient);
    
    // Mock crypto API for hashing
    if (!global.crypto) {
      global.crypto = {} as any;
    }
    global.crypto.subtle = {
      digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
    } as any;
    
    // Load the background script
    console.log('About to require background script...');
    try {
      require('../../extension/src/background/index.ts');
      console.log('Background script required successfully');
    } catch (error) {
      console.log('Error requiring background script:', error);
    }
    
    // Give time for async initialization
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Verify handlers were registered
    const registeredHandlers = mockMessageBus.on.mock.calls;
    console.log('Total handlers registered:', registeredHandlers.length);
    registeredHandlers.forEach((call, i) => {
      console.log(`Handler ${i}: ${call[0]}`);
    });
  });

  describe('Initialization', () => {
    it('should initialize storage and API on startup', async () => {
      // Give async initialization time to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockStorageService.initialize).toHaveBeenCalled();
      expect(mockStorageService.getConfig).toHaveBeenCalled();
      expect(mockStingerClient.updateConfig).toHaveBeenCalledWith({
        baseUrl: 'http://localhost:8888',
        timeout: 2000,
      });
      expect(mockStingerClient.health).toHaveBeenCalled();
      expect(mockStingerClient.getRules).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      mockStorageService.initialize.mockRejectedValueOnce(new Error('Storage error'));
      
      // Re-run initialization
      jest.isolateModules(() => {
        require('../../extension/src/background/index.ts');
      });
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to initialize background worker',
        expect.any(Error)
      );
    });

    it('should continue if API health check fails', async () => {
      mockStingerClient.health.mockResolvedValueOnce({ 
        success: false, 
        error: new Error('API unavailable') 
      });
      
      jest.isolateModules(() => {
        require('../../extension/src/background/index.ts');
      });
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'API health check failed',
        expect.any(Error)
      );
      expect(mockStingerClient.getRules).toHaveBeenCalled(); // Should still try to load rules
    });
  });

  describe('Content Script Communication', () => {
    it('should handle CONTENT_LOADED message', async () => {
      expect(contentLoadedHandler).toBeDefined();
      
      const message: ContentLoadedMessage = {
        type: 'CONTENT_LOADED',
        id: 'test-id',
        timestamp: Date.now(),
        payload: {
          url: 'https://chat.openai.com',
          hostname: 'chat.openai.com',
        },
      };
      
      const sender = { tab: { id: 123, url: 'https://chat.openai.com' } };
      
      const response = await contentLoadedHandler(message, sender);
      
      expect(response).toEqual({
        success: true,
        data: {
          message: 'Background worker received content load',
          config: expect.objectContaining({
            apiUrl: 'http://localhost:8888',
          }),
        },
      });
      
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Content script loaded',
        { url: message.payload.url, tabId: 123 }
      );
    });
  });

  describe('Prompt Checking', () => {
    beforeEach(() => {
      mockStingerClient.checkContent.mockResolvedValue({
        success: true,
        data: {
          action: 'allow',
          reasons: [],
          warnings: [],
        },
      });
    });

    it('should check prompts and send results back', async () => {
      const message: CheckPromptMessage = {
        type: 'CHECK_PROMPT',
        id: 'prompt-123',
        timestamp: Date.now(),
        payload: {
          text: 'Tell me about security vulnerabilities',
          metadata: { source: 'chat-input' },
        },
      };
      
      const sender = { 
        tab: { 
          id: 456, 
          url: 'https://chat.openai.com/chat/abc123' 
        } 
      };
      
      const response = await checkPromptHandler(message, sender);
      
      // Verify API call
      expect(mockStingerClient.checkContent).toHaveBeenCalledWith({
        text: message.payload.text,
        kind: 'prompt',
        tenantId: undefined,
        userId: undefined,
      });
      
      // Note: Audit events are handled by the backend, not stored locally
      
      // Verify message sent to tab
      expect(mockMessageBus.sendToTab).toHaveBeenCalledWith(
        456,
        expect.objectContaining({
          type: 'CHECK_RESULT',
          payload: {
            action: 'allow',
            reasons: [],
            warnings: [],
            originalMessageId: 'prompt-123',
          },
        })
      );
      
      expect(response).toEqual({
        success: true,
        data: { action: 'allow', reasons: [], warnings: [] },
      });
    });

    it('should handle blocked prompts', async () => {
      mockStingerClient.checkContent.mockResolvedValueOnce({
        success: true,
        data: {
          action: 'block',
          reasons: ['Contains PII', 'Policy violation'],
          warnings: [],
        },
      });
      
      const message: CheckPromptMessage = {
        type: 'CHECK_PROMPT',
        id: 'prompt-456',
        timestamp: Date.now(),
        payload: {
          text: 'My SSN is 123-45-6789',
        },
      };
      
      const sender = { tab: { id: 789, url: 'https://chat.openai.com' } };
      
      await checkPromptHandler(message, sender);
      
      // Note: Audit events are handled by the backend
      
      expect(mockMessageBus.sendToTab).toHaveBeenCalledWith(
        789,
        expect.objectContaining({
          payload: expect.objectContaining({
            action: 'block',
            reasons: ['Contains PII', 'Policy violation'],
          }),
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      mockStingerClient.checkContent.mockResolvedValueOnce({
        success: false,
        error: new Error('API timeout'),
      });
      
      const message: CheckPromptMessage = {
        type: 'CHECK_PROMPT',
        id: 'prompt-789',
        timestamp: Date.now(),
        payload: { text: 'Test prompt' },
      };
      
      const response = await checkPromptHandler(message, { tab: { id: 123 } });
      
      expect(response).toEqual({
        success: false,
        error: 'API timeout',
      });
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Prompt check failed',
        expect.any(Error)
      );
      
      // Should not send result on error
      expect(mockMessageBus.sendToTab).not.toHaveBeenCalled();
    });

    it('should use tenant and user IDs from config', async () => {
      mockStorageService.getConfig.mockResolvedValueOnce({
        apiUrl: 'http://localhost:8888',
        apiTimeout: 2000,
        debugMode: false,
        logLevel: 'info',
        tenantId: 'tenant-123',
        userId: 'user-456',
      });
      
      const message: CheckPromptMessage = {
        type: 'CHECK_PROMPT',
        id: 'prompt-with-ids',
        timestamp: Date.now(),
        payload: { text: 'Test with IDs' },
      };
      
      await checkPromptHandler(message, { tab: { id: 111 } });
      
      expect(mockStingerClient.checkContent).toHaveBeenCalledWith({
        text: 'Test with IDs',
        kind: 'prompt',
        tenantId: 'tenant-123',
        userId: 'user-456',
      });
    });
  });

  describe('Response Checking', () => {
    it('should check responses similarly to prompts', async () => {
      mockStingerClient.checkContent.mockResolvedValueOnce({
        success: true,
        data: {
          action: 'warn',
          reasons: [],
          warnings: ['May contain sensitive information'],
        },
      });
      
      const message: CheckResponseMessage = {
        type: 'CHECK_RESPONSE',
        id: 'response-123',
        timestamp: Date.now(),
        payload: {
          text: 'The API key is sk-1234567890',
          metadata: { model: 'gpt-4' },
        },
      };
      
      const sender = { tab: { id: 222, url: 'https://chat.openai.com' } };
      
      await checkResponseHandler(message, sender);
      
      expect(mockStingerClient.checkContent).toHaveBeenCalledWith({
        text: message.payload.text,
        kind: 'response', // Different from prompt
        tenantId: undefined,
        userId: undefined,
      });
      
      // Note: Audit events are handled by the backend
    });
  });

  // Hashing tests removed - hashing is handled by backend

  describe('Error Scenarios', () => {
    it('should handle missing tab information', async () => {
      const message: CheckPromptMessage = {
        type: 'CHECK_PROMPT',
        id: 'no-tab',
        timestamp: Date.now(),
        payload: { text: 'Test without tab' },
      };
      
      mockStingerClient.checkContent.mockResolvedValueOnce({
        success: true,
        data: { action: 'allow', reasons: [], warnings: [] },
      });
      
      // Sender without tab info
      await checkPromptHandler(message, {});
      
      // Should still process successfully
      
      // Should not attempt to send to tab
      expect(mockMessageBus.sendToTab).not.toHaveBeenCalled();
    });

    it('should handle exceptions during processing', async () => {
      mockStingerClient.checkContent.mockRejectedValueOnce(
        new Error('Unexpected error')
      );
      
      const message: CheckPromptMessage = {
        type: 'CHECK_PROMPT',
        id: 'error-test',
        timestamp: Date.now(),
        payload: { text: 'This will error' },
      };
      
      const response = await checkPromptHandler(message, { tab: { id: 333 } });
      
      expect(response).toEqual({
        success: false,
        error: 'Internal error',
      });
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error checking prompt',
        expect.any(Error)
      );
    });
  });

  describe('Chrome Extension Lifecycle', () => {
    it('should handle extension installation', () => {
      const onInstalledHandler = (chrome.runtime.onInstalled.addListener as jest.Mock)
        .mock.calls.find(call => typeof call[0] === 'function')?.[0];
      
      expect(onInstalledHandler).toBeDefined();
      
      // Simulate installation
      onInstalledHandler({ reason: 'install' });
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Extension installed/updated',
        { reason: 'install' }
      );
    });

    it('should handle extension update', () => {
      const onInstalledHandler = (chrome.runtime.onInstalled.addListener as jest.Mock)
        .mock.calls.find(call => typeof call[0] === 'function')?.[0];
      
      onInstalledHandler({ 
        reason: 'update',
        previousVersion: '0.0.1'
      });
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Extension installed/updated',
        expect.objectContaining({ 
          reason: 'update',
          previousVersion: '0.0.1'
        })
      );
    });
  });
});