import { StorageService } from '../../extension/src/shared/storage/StorageService';
import { ChromeWrapper } from '../../extension/src/shared/chrome/ChromeWrapper';
import { DEFAULT_CONFIG } from '../../extension/src/shared/types/storage';

// Mock ChromeWrapper
jest.mock('../../extension/src/shared/chrome/ChromeWrapper');

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(() => {
    jest.clearAllMocks();
    storageService = new StorageService();
    
    // Setup default mock implementations
    (ChromeWrapper.storage.get as jest.Mock).mockResolvedValue({});
    (ChromeWrapper.storage.set as jest.Mock).mockResolvedValue(undefined);
    (ChromeWrapper.storage.getBytesInUse as jest.Mock).mockResolvedValue(1000);
  });

  describe('getConfig', () => {
    it('should return default config when none exists', async () => {
      const config = await storageService.getConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should merge stored config with defaults', async () => {
      (ChromeWrapper.storage.get as jest.Mock).mockResolvedValue({
        config: {
          apiUrl: 'https://custom.api',
          debugMode: false,
        },
      });

      const config = await storageService.getConfig();
      
      expect(config).toEqual({
        ...DEFAULT_CONFIG,
        apiUrl: 'https://custom.api',
        debugMode: false,
      });
    });
  });

  describe('addAuditEvent', () => {
    it('should add event to queue', async () => {
      const event = {
        id: 'test-id',
        timestamp: Date.now(),
        type: 'prompt' as const,
        action: 'allow' as const,
        text: 'test text',
        hash: 'test-hash',
        url: 'https://test.com',
      };

      await storageService.addAuditEvent(event);

      expect(ChromeWrapper.storage.set).toHaveBeenCalledWith({
        auditQueue: [event],
      });
    });

    it('should limit queue size to 1000 events', async () => {
      const existingQueue = Array(1000).fill(null).map((_, i) => ({
        id: `old-${i}`,
        timestamp: Date.now() - 10000,
        type: 'prompt' as const,
        action: 'allow' as const,
        text: 'old event',
        hash: 'old-hash',
        url: 'https://old.com',
      }));

      (ChromeWrapper.storage.get as jest.Mock).mockResolvedValue({
        auditQueue: existingQueue,
      });

      const newEvent = {
        id: 'new-event',
        timestamp: Date.now(),
        type: 'prompt' as const,
        action: 'block' as const,
        text: 'new text',
        hash: 'new-hash',
        url: 'https://new.com',
      };

      await storageService.addAuditEvent(newEvent);

      const setCall = (ChromeWrapper.storage.set as jest.Mock).mock.calls[0][0];
      expect(setCall.auditQueue).toHaveLength(1000);
      expect(setCall.auditQueue[999]).toEqual(newEvent);
    });
  });

  describe('cache operations', () => {
    it('should store and retrieve cached values', async () => {
      const value = { test: 'data' };
      await storageService.setCached('test-key', value, 5000);

      const setCall = (ChromeWrapper.storage.set as jest.Mock).mock.calls[0][0];
      expect(setCall.cache['test-key']).toMatchObject({
        key: 'test-key',
        value,
      });
      expect(setCall.cache['test-key'].expires).toBeGreaterThan(Date.now());
    });

    it('should return undefined for expired cache entries', async () => {
      const expiredEntry = {
        key: 'test-key',
        value: 'old-value',
        expires: Date.now() - 1000, // Expired 1 second ago
      };

      (ChromeWrapper.storage.get as jest.Mock).mockResolvedValue({
        cache: { 'test-key': expiredEntry },
      });

      const result = await storageService.getCached('test-key');
      expect(result).toBeUndefined();
    });
  });
});