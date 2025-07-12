import { StorageService } from '../../extension/src/shared/storage/StorageService';
import { ChromeWrapper } from '../../extension/src/shared/chrome/ChromeWrapper';
import { DEFAULT_CONFIG } from '../../extension/src/shared/types/storage';
import type { ExtensionConfig, PolicyRules } from '../../extension/src/shared/types/storage';

// Mock ChromeWrapper
jest.mock('../../extension/src/shared/chrome/ChromeWrapper');

describe('StorageService', () => {
  let storageService: StorageService;
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;
  let mockRemove: jest.Mock;
  let mockClear: jest.Mock;
  let mockGetBytesInUse: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockGet = jest.fn().mockResolvedValue({});
    mockSet = jest.fn().mockResolvedValue(undefined);
    mockRemove = jest.fn().mockResolvedValue(undefined);
    mockClear = jest.fn().mockResolvedValue(undefined);
    mockGetBytesInUse = jest.fn().mockResolvedValue(1000);
    
    (ChromeWrapper.storage.get as jest.Mock) = mockGet;
    (ChromeWrapper.storage.set as jest.Mock) = mockSet;
    (ChromeWrapper.storage.remove as jest.Mock) = mockRemove;
    (ChromeWrapper.storage.clear as jest.Mock) = mockClear;
    (ChromeWrapper.storage.getBytesInUse as jest.Mock) = mockGetBytesInUse;
    
    storageService = new StorageService();
  });

  describe('Configuration Management', () => {
    it('should return default config when none exists', async () => {
      const config = await storageService.getConfig();
      
      expect(mockGet).toHaveBeenCalledWith('config');
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should merge stored config with defaults', async () => {
      const storedConfig: Partial<ExtensionConfig> = {
        apiUrl: 'https://custom.api',
        debugMode: true,
      };
      
      mockGet.mockResolvedValue({ config: storedConfig });
      
      const config = await storageService.getConfig();
      
      expect(config).toEqual({
        ...DEFAULT_CONFIG,
        ...storedConfig,
      });
      
      // Verify all default fields are present
      expect(config.apiTimeout).toBe(DEFAULT_CONFIG.apiTimeout);
      expect(config.logLevel).toBe(DEFAULT_CONFIG.logLevel);
    });

    it('should update configuration correctly', async () => {
      // First call returns current config
      mockGet.mockResolvedValueOnce({ config: DEFAULT_CONFIG });
      
      const updates: Partial<ExtensionConfig> = {
        apiUrl: 'https://new.api',
        tenantId: 'tenant-123',
        userId: 'user-456',
      };
      
      await storageService.updateConfig(updates);
      
      expect(mockSet).toHaveBeenCalledWith({
        config: {
          ...DEFAULT_CONFIG,
          ...updates,
        },
      });
    });

    it('should handle partial updates without losing existing values', async () => {
      const existingConfig: ExtensionConfig = {
        ...DEFAULT_CONFIG,
        apiUrl: 'https://existing.api',
        tenantId: 'existing-tenant',
      };
      
      mockGet.mockResolvedValueOnce({ config: existingConfig });
      
      await storageService.updateConfig({ userId: 'new-user' });
      
      expect(mockSet).toHaveBeenCalledWith({
        config: {
          ...existingConfig,
          userId: 'new-user',
        },
      });
    });
  });

  // Note: Audit Event Management tests removed
  // All audit logging is handled by the Stinger backend, not locally

  describe('Cache Operations', () => {
    it('should cache values with TTL', async () => {
      const testData = { foo: 'bar', count: 42 };
      const ttl = 5000; // 5 seconds
      
      const beforeCache = Date.now();
      await storageService.setCached('test-key', testData, ttl);
      const afterCache = Date.now();
      
      const setCall = mockSet.mock.calls[0][0];
      const cachedEntry = setCall.cache['test-key'];
      
      expect(cachedEntry.key).toBe('test-key');
      expect(cachedEntry.value).toEqual(testData);
      expect(cachedEntry.expires).toBeGreaterThanOrEqual(beforeCache + ttl);
      expect(cachedEntry.expires).toBeLessThanOrEqual(afterCache + ttl);
    });

    it('should use default TTL when not specified', async () => {
      const beforeCache = Date.now();
      await storageService.setCached('test-key', 'test-value');
      const afterCache = Date.now();
      
      const setCall = mockSet.mock.calls[0][0];
      const cachedEntry = setCall.cache['test-key'];
      
      // Default TTL is 300000ms (5 minutes)
      expect(cachedEntry.expires).toBeGreaterThanOrEqual(beforeCache + 300000);
      expect(cachedEntry.expires).toBeLessThanOrEqual(afterCache + 300000);
    });

    it('should retrieve valid cached values', async () => {
      const cachedData = {
        key: 'test-key',
        value: { data: 'test' },
        expires: Date.now() + 10000, // Valid for 10 seconds
      };
      
      mockGet.mockResolvedValueOnce({
        cache: { 'test-key': cachedData },
      });
      
      const result = await storageService.getCached<{ data: string }>('test-key');
      
      expect(result).toEqual({ data: 'test' });
      expect(mockSet).not.toHaveBeenCalled(); // Should not update storage
    });

    it('should return undefined and clean up expired entries', async () => {
      const expiredEntry = {
        key: 'expired-key',
        value: 'old-value',
        expires: Date.now() - 1000, // Expired 1 second ago
      };
      
      const validEntry = {
        key: 'valid-key',
        value: 'valid-value',
        expires: Date.now() + 10000,
      };
      
      mockGet.mockResolvedValueOnce({
        cache: {
          'expired-key': expiredEntry,
          'valid-key': validEntry,
        },
      });
      
      const result = await storageService.getCached('expired-key');
      
      expect(result).toBeUndefined();
      expect(mockSet).toHaveBeenCalledWith({
        cache: { 'valid-key': validEntry }, // Expired entry removed
      });
    });

    it('should handle cache cleanup correctly', async () => {
      const cache = {
        'expired-1': { key: 'expired-1', value: 'v1', expires: Date.now() - 2000 },
        'valid-1': { key: 'valid-1', value: 'v2', expires: Date.now() + 5000 },
        'expired-2': { key: 'expired-2', value: 'v3', expires: Date.now() - 1000 },
        'valid-2': { key: 'valid-2', value: 'v4', expires: Date.now() + 10000 },
      };
      
      mockGet.mockResolvedValueOnce({ cache });
      
      await storageService.cleanupCache();
      
      expect(mockSet).toHaveBeenCalledWith({
        cache: {
          'valid-1': cache['valid-1'],
          'valid-2': cache['valid-2'],
        },
      });
    });

    it('should not update storage if no expired entries', async () => {
      const cache = {
        'valid-1': { key: 'valid-1', value: 'v1', expires: Date.now() + 5000 },
        'valid-2': { key: 'valid-2', value: 'v2', expires: Date.now() + 10000 },
      };
      
      mockGet.mockResolvedValueOnce({ cache });
      
      await storageService.cleanupCache();
      
      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  describe('Storage Quota Management', () => {
    it('should check storage quota before writing', async () => {
      mockGetBytesInUse.mockResolvedValueOnce(1000000); // 1MB used
      
      await storageService.set('config', DEFAULT_CONFIG);
      
      expect(mockGetBytesInUse).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith({ config: DEFAULT_CONFIG });
    });

    it('should clear cache when approaching quota limit', async () => {
      // 90% of 5MB = 90% of 5,242,880 = 4,718,592 bytes
      mockGetBytesInUse.mockResolvedValueOnce(4718593); // Just over threshold
      
      await storageService.set('config', DEFAULT_CONFIG);
      
      // Check what was called
      expect(mockGetBytesInUse).toHaveBeenCalled();
      
      // Should clear cache
      expect(mockSet).toHaveBeenCalledTimes(2);
      expect(mockSet).toHaveBeenNthCalledWith(1, { cache: {} });
      expect(mockSet).toHaveBeenNthCalledWith(2, { config: DEFAULT_CONFIG });
    });

    it('should log warning if still over quota after cache clear', async () => {
      // First check shows over quota
      mockGetBytesInUse.mockResolvedValueOnce(4718593);
      // After cache clear, still over quota
      mockGetBytesInUse.mockResolvedValueOnce(4718593);
      
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
      
      await storageService.set('config', DEFAULT_CONFIG);
      
      // Should clear cache and set config
      expect(mockSet).toHaveBeenCalledTimes(2);
      expect(mockSet).toHaveBeenNthCalledWith(1, { cache: {} });
      expect(mockSet).toHaveBeenNthCalledWith(2, { config: DEFAULT_CONFIG });
      
      // Should log warning about quota
      expect(consoleWarn).toHaveBeenCalledWith('Storage still over quota after cache clear:', 4718593);
      
      consoleWarn.mockRestore();
    });
  });

  describe('Rules Management', () => {
    it('should get and update rules with timestamp', async () => {
      const rules: Omit<PolicyRules, 'lastUpdated'> = {
        version: '1.0.0',
        preset: 'standard',
        guardrails: {
          input_guardrails: { 'pii-filter': { enabled: true } },
          output_guardrails: { 'data-leak': { enabled: true } },
        },
      };
      
      const beforeUpdate = Date.now();
      await storageService.updateRules(rules);
      const afterUpdate = Date.now();
      
      const setCall = mockSet.mock.calls[0][0];
      expect(setCall.rules).toMatchObject(rules);
      expect(setCall.rules.lastUpdated).toBeGreaterThanOrEqual(beforeUpdate);
      expect(setCall.rules.lastUpdated).toBeLessThanOrEqual(afterUpdate);
    });

    it('should retrieve stored rules', async () => {
      const storedRules: PolicyRules = {
        version: '1.0.0',
        preset: 'strict',
        guardrails: {
          input_guardrails: {},
          output_guardrails: {},
        },
        lastUpdated: Date.now() - 3600000,
      };
      
      mockGet.mockResolvedValueOnce({ rules: storedRules });
      
      const rules = await storageService.getRules();
      
      expect(rules).toEqual(storedRules);
    });
  });

  describe('Initialization', () => {
    it('should initialize all storage keys with defaults', async () => {
      // Mock bulk get to return empty object
      mockGet.mockResolvedValue({});
      
      await storageService.initialize();
      
      expect(mockGet).toHaveBeenCalledWith(['config', 'cache', 'lastSync']);
      
      // Should set 3 keys: config, cache, lastSync (no auditQueue)
      expect(mockSet).toHaveBeenCalledTimes(3);
      expect(mockSet).toHaveBeenCalledWith({ config: DEFAULT_CONFIG });
      expect(mockSet).toHaveBeenCalledWith({ cache: {} });
      expect(mockSet).toHaveBeenCalledWith({ lastSync: { rules: 0 } });
    });

    it('should not overwrite existing values during initialization', async () => {
      const existingConfig: ExtensionConfig = {
        ...DEFAULT_CONFIG,
        apiUrl: 'https://existing.api',
      };
      
      mockGet.mockResolvedValueOnce({
        config: existingConfig,
        cache: { key: 'value' },
        lastSync: { rules: 123 }
      });
      
      await storageService.initialize();
      
      // Should not call set if values already exist
      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle Chrome storage errors gracefully', async () => {
      mockGet.mockRejectedValueOnce(new Error('Chrome storage error'));
      
      const result = await storageService.get('config');
      
      expect(result).toBeUndefined();
    });

    it('should continue with default config on storage errors', async () => {
      mockGet.mockRejectedValueOnce(new Error('Storage unavailable'));
      
      const config = await storageService.getConfig();
      
      // Should still return default config
      expect(config).toEqual(DEFAULT_CONFIG);
    });
  });
});