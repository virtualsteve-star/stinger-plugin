import { StingerClient } from '../../extension/src/shared/api/StingerClient';
import { ApiResult } from '../../extension/src/shared/types/api';

// Mock global fetch
global.fetch = jest.fn();

// TODO: Issue #8 - Fix test architecture issues
describe.skip('StingerClient', () => {
  let client: StingerClient;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    client = new StingerClient({
      baseUrl: 'http://localhost:8888',
      timeout: 1000,
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      client.updateConfig({
        baseUrl: 'https://api.stinger.test',
        timeout: 5000,
      });

      // Verify by making a request
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 'healthy' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      client.health();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.stinger.test/v1/health',
        expect.any(Object)
      );
    });
  });

  describe('Health Check', () => {
    it('should check API health successfully', async () => {
      const healthResponse = {
        status: 'healthy',
        version: '1.0.0',
        uptime: 3600,
      };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(healthResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await client.health();

      expect(result).toEqual({
        success: true,
        data: healthResponse,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8888/v1/health',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }),
          signal: expect.any(Object),
        })
      );
    });

    it('should handle unhealthy API', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Service Unavailable', { status: 503 })
      );

      const result = await client.health();

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('HTTP error! status: 503');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.health();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Network error');
    });
  });

  describe('Content Checking', () => {
    it('should check content successfully', async () => {
      const checkResponse = {
        action: 'allow',
        reasons: [],
        warnings: [],
      };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(checkResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await client.checkContent({
        text: 'Hello world',
        kind: 'prompt',
        tenantId: 'tenant-123',
        userId: 'user-456',
      });

      expect(result).toEqual({
        success: true,
        data: checkResponse,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8888/v1/check',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            text: 'Hello world',
            kind: 'prompt',
            tenantId: 'tenant-123',
            userId: 'user-456',
          }),
        })
      );
    });

    it('should handle blocked content', async () => {
      const blockResponse = {
        action: 'block',
        reasons: ['Contains PII', 'Policy violation'],
        warnings: [],
      };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(blockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await client.checkContent({
        text: 'My SSN is 123-45-6789',
        kind: 'prompt',
      });

      expect(result.success).toBe(true);
      expect(result.data?.action).toBe('block');
      expect(result.data?.reasons).toContain('Contains PII');
    });

    it('should handle detached mode', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('', { status: 202 }) // Accepted
      );

      const result = await client.checkContent({
        text: 'Test detached',
        detached: true,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined(); // No response body in detached mode
    });

    it('should handle API validation errors', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: 'Invalid request',
            details: { text: 'Text is required' },
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      const result = await client.checkContent({
        text: '',
        kind: 'prompt',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('HTTP error! status: 400');
    });
  });

  describe('Rules Management', () => {
    it('should fetch rules successfully', async () => {
      const rulesResponse = {
        version: '1.0.0',
        preset: 'standard',
        guardrails: {
          input_guardrails: {
            'pii-filter': { enabled: true, sensitivity: 'high' },
          },
          output_guardrails: {
            'data-leak': { enabled: true, patterns: ['api_key', 'password'] },
          },
        },
      };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(rulesResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await client.getRules();

      expect(result).toEqual({
        success: true,
        data: rulesResponse,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8888/v1/rules',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle missing rules', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Not Found', {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await client.getRules();

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('404');
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout long requests', async () => {
      // Mock fetch that respects abort signal
      mockFetch.mockImplementationOnce(
        (_url, options) => new Promise((resolve, reject) => {
          const signal = options?.signal as AbortSignal;
          if (signal) {
            signal.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted', 'AbortError'));
            });
          }
          // Never resolves otherwise
        })
      );

      const result = await client.checkContent({
        text: 'This will timeout',
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('timeout');
    }, 5000);

    it('should respect custom timeout', async () => {
      client.updateConfig({ timeout: 100 }); // Very short timeout

      // Mock fetch to respect abort signal
      mockFetch.mockImplementationOnce(
        (url, options) =>
          new Promise((resolve, reject) => {
            const signal = options?.signal as AbortSignal;
            
            if (signal) {
              signal.addEventListener('abort', () => {
                reject(new DOMException('Aborted', 'AbortError'));
              });
            }

            setTimeout(
              () =>
                resolve(
                  new Response(JSON.stringify({ action: 'allow' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                  })
                ),
              200
            );
          })
      );

      const result = await client.checkContent({ text: 'test' });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('timeout');
    });
  });

  describe('Error Handling', () => {
    it('should handle JSON parse errors', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Invalid JSON', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await client.health();

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Unexpected token');
    });

    it('should handle empty responses', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await client.getRules();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle non-JSON responses', async () => {
      const response = new Response('<html>Error page</html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
      
      console.log('Response object:', response);
      console.log('Response.ok:', response.ok);
      
      mockFetch.mockResolvedValueOnce(response);

      const result = await client.checkContent({ text: 'test' });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Expected JSON response');
    });
  });

  describe('Request Headers', () => {
    it('should send correct headers', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ action: 'allow' }), { status: 200 })
      );

      await client.checkContent({
        text: 'Test headers',
        tenantId: 'tenant-abc',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }),
        })
      );
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const responses = [
        { action: 'allow', reasons: [] },
        { action: 'warn', warnings: ['Sensitive content'] },
        { action: 'block', reasons: ['Policy violation'] },
      ];

      responses.forEach((response, index) => {
        mockFetch.mockResolvedValueOnce(
          new Response(JSON.stringify(response), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });

      const requests = [
        client.checkContent({ text: 'Request 1' }),
        client.checkContent({ text: 'Request 2' }),
        client.checkContent({ text: 'Request 3' }),
      ];

      const results = await Promise.all(requests);

      expect(results).toHaveLength(3);
      expect(results[0].data?.action).toBe('allow');
      expect(results[1].data?.action).toBe('warn');
      expect(results[2].data?.action).toBe('block');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large text payloads', async () => {
      const largeText = 'x'.repeat(100000); // 100KB of text

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ action: 'allow' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await client.checkContent({ text: largeText });

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining(largeText),
        })
      );
    });

    it('should handle special characters in text', async () => {
      const specialText = 'Test with "quotes" and \n newlines and émojis 🚀';

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ action: 'allow' }), { status: 200 })
      );

      await client.checkContent({ text: specialText });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);
      expect(body.text).toBe(specialText);
    });

    it('should handle undefined optional parameters', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ action: 'allow' }), { status: 200 })
      );

      await client.checkContent({
        text: 'Test',
        tenantId: undefined,
        userId: undefined,
        kind: undefined,
      });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);
      
      // Undefined values should be omitted from request
      expect(body).toEqual({ text: 'Test' });
      expect(body.tenantId).toBeUndefined();
      expect(body.userId).toBeUndefined();
      expect(body.kind).toBeUndefined();
    });
  });
});