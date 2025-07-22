/**
 * Tests for StingerClientV2 - Phase 15 API
 */

import { StingerClientV2 } from '../../extension/src/shared/api/StingerClientV2';

// Mock fetch
global.fetch = jest.fn();

describe('StingerClientV2', () => {
  let client: StingerClientV2;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new StingerClientV2('http://localhost:8100');
  });

  describe('check method', () => {
    it('should send correct request format', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          action: 'allow',
          reasons: [],
          warnings: [],
          metadata: {
            guardrails_triggered: ['test'],
            processing_time_ms: 10,
          },
        }),
      });

      await client.check({
        text: 'test content',
        kind: 'prompt',
        mode: 'default',
        preset: 'demo_showcase',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8100/v1/check',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: 'test content',
            kind: 'prompt',
            mode: 'default',
            preset: 'demo_showcase',
          }),
        }),
      );
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await client.check({
        text: 'test',
        kind: 'prompt',
      });

      expect(result.action).toBe('allow');
      expect(result.warnings).toContain('Security check unavailable');
    });

    it('should handle timeout', async () => {
      const abortError = new Error();
      abortError.name = 'AbortError';
      (global.fetch as jest.Mock).mockRejectedValueOnce(abortError);

      const result = await client.check({
        text: 'test',
        kind: 'prompt',
      });

      expect(result.action).toBe('allow');
      expect(result.warnings).toContain('Security check unavailable');
    });
  });

  describe('checkInput method', () => {
    it('should use default mode for input checking', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          action: 'block',
          reasons: ['Contains PII'],
          warnings: [],
          metadata: {
            guardrails_triggered: ['pii_detection'],
            processing_time_ms: 150,
          },
        }),
      });

      const result = await client.checkInput('My SSN is 123-45-6789');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8100/v1/check',
        expect.objectContaining({
          body: JSON.stringify({
            text: 'My SSN is 123-45-6789',
            kind: 'prompt',
            mode: 'default',
            preset: 'demo_showcase',
          }),
        }),
      );

      expect(result.action).toBe('block');
      expect(result.reasons).toContain('Contains PII');
    });
  });

  describe('checkOutput method', () => {
    it('should use streaming_final mode for output checking', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          action: 'allow',
          reasons: [],
          warnings: ['May contain sensitive content'],
          metadata: {
            guardrails_triggered: ['content_filter'],
            processing_time_ms: 200,
          },
        }),
      });

      const result = await client.checkOutput('Here is the response...');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8100/v1/check',
        expect.objectContaining({
          body: JSON.stringify({
            text: 'Here is the response...',
            kind: 'response',
            mode: 'streaming_final',
            preset: 'demo_showcase',
          }),
        }),
      );

      expect(result.action).toBe('allow');
      expect(result.warnings).toContain('May contain sensitive content');
    });
  });

  describe('healthCheck method', () => {
    it('should return true when API is healthy', async () => {
      // Mock AbortSignal.timeout if it doesn't exist
      if (!AbortSignal.timeout) {
        AbortSignal.timeout = jest.fn(() => new AbortController().signal);
      }
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'healthy' }),
      });

      const isHealthy = await client.healthCheck();

      expect(isHealthy).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8100/v1/health',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it('should return false when API is unhealthy', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'unhealthy' }),
      });

      const isHealthy = await client.healthCheck();

      expect(isHealthy).toBe(false);
    });

    it('should return false on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const isHealthy = await client.healthCheck();

      expect(isHealthy).toBe(false);
    });
  });

  describe('fail-open behavior', () => {
    it('should allow content when API returns non-OK status', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await client.check({
        text: 'test',
        kind: 'prompt',
      });

      expect(result.action).toBe('allow');
      expect(result.warnings).toContain('Security check unavailable');
    });

    it('should allow content when API is unreachable', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const result = await client.checkInput('test prompt');

      expect(result.action).toBe('allow');
      expect(result.warnings).toContain('Security check unavailable');
    });
  });
});