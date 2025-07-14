/**
 * Unit tests for StingerSSEClient
 */

import { StingerSSEClient } from '../../extension/src/shared/api/StingerSSEClient';
import type { GuardrailResult, SSEAnalysisResult } from '../../extension/src/shared/api/StingerSSEClient';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder and TextDecoder for Node.js environment
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// Mock fetch and ReadableStream
global.fetch = jest.fn();
global.ReadableStream = jest.fn() as any;

// Mock chrome API
global.chrome = {
  runtime: {
    getManifest: jest.fn(() => ({ version: '0.1.0-test' })),
  },
} as any;

// Mock window with Object.defineProperty to avoid JSDOM navigation errors
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'chatgpt.com',
  },
  writable: true,
});

describe('StingerSSEClient', () => {
  let client: StingerSSEClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new StingerSSEClient({
      baseUrl: 'http://localhost:8000',
      timeout: 5000,
    });
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const defaultClient = new StingerSSEClient();
      expect(defaultClient).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customClient = new StingerSSEClient({
        baseUrl: 'https://api.example.com',
        timeout: 10000,
        headers: { 'X-Custom': 'header' },
      });
      expect(customClient).toBeDefined();
    });
  });

  describe('isSupported', () => {
    it('should return true when fetch and ReadableStream are available', () => {
      expect(StingerSSEClient.isSupported()).toBe(true);
    });

    it('should return false when fetch is not available', () => {
      const originalFetch = global.fetch;
      (global as any).fetch = undefined;
      expect(StingerSSEClient.isSupported()).toBe(false);
      global.fetch = originalFetch;
    });
  });

  describe('analyzeWithStreaming', () => {
    it('should reject empty text', async () => {
      await expect(client.analyzeWithStreaming('')).rejects.toThrow('Invalid text content');
    });

    it('should reject non-string input', async () => {
      await expect(client.analyzeWithStreaming(null as any)).rejects.toThrow('Invalid text content');
    });

    it('should reject text that exceeds max length', async () => {
      const longText = 'a'.repeat(100001);
      await expect(client.analyzeWithStreaming(longText)).rejects.toThrow('Text content too large');
    });

    it('should handle HTTP errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(client.analyzeWithStreaming('test')).rejects.toThrow('HTTP error! status: 500');
    });

    it('should handle missing response body', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: null,
      });

      await expect(client.analyzeWithStreaming('test')).rejects.toThrow('ReadableStream not supported');
    });

    it('should send correct headers', async () => {
      const mockBody = createMockReadableStream([]);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockBody,
      });

      await client.analyzeWithStreaming('test prompt');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/stream/analyze',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            'X-Extension-Version': '0.1.0-test',
            'X-User-Context': 'chatgpt',
          }),
          body: JSON.stringify({ content: 'test prompt' }),
        }),
      );
    });
  });

  describe('SSE event processing', () => {
    it('should process guardrail_result events', async () => {
      const mockEvents = [
        'data: {"type":"guardrail_result","guardrail_id":"keyword_block","performance_class":"FAST","result":{"action":"allow","blocked":false,"confidence":1.0,"reason":""},"timestamp":"2024-01-01T00:00:00Z","processing_time_ms":5}\n\n',
        'data: {"type":"stream_complete"}\n\n',
      ];

      const mockBody = createMockReadableStream(mockEvents);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockBody,
      });

      const result = await client.analyzeWithStreaming('test');

      expect(result.guardrailResults).toHaveLength(1);
      expect(result.guardrailResults[0].guardrail_id).toBe('keyword_block');
      expect(result.blocked).toBe(false);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle blocked guardrail results', async () => {
      const mockEvents = [
        'data: {"type":"guardrail_result","guardrail_id":"pii_detection","performance_class":"FAST","result":{"action":"block","blocked":true,"confidence":0.95,"reason":"PII detected"},"timestamp":"2024-01-01T00:00:00Z","processing_time_ms":10}\n\n',
        'data: {"type":"stream_complete"}\n\n',
      ];

      const mockBody = createMockReadableStream(mockEvents);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockBody,
      });

      const result = await client.analyzeWithStreaming('test');

      expect(result.blocked).toBe(true);
      expect(result.reasons).toContain('PII detected');
    });

    it('should collect warnings from guardrails', async () => {
      const mockEvents = [
        'data: {"type":"guardrail_result","guardrail_id":"toxicity_check","performance_class":"SLOW","result":{"action":"warn","blocked":false,"confidence":0.7,"reason":"Potentially inappropriate content"},"timestamp":"2024-01-01T00:00:00Z","processing_time_ms":150}\n\n',
        'data: {"type":"stream_complete"}\n\n',
      ];

      const mockBody = createMockReadableStream(mockEvents);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockBody,
      });

      const result = await client.analyzeWithStreaming('test');

      expect(result.blocked).toBe(false);
      expect(result.warnings).toContain('Potentially inappropriate content');
    });

    it('should handle input_blocked events', async () => {
      const mockEvents = [
        'data: {"type":"input_blocked","reason":"Conversation limit exceeded"}\n\n',
        'data: {"type":"stream_complete"}\n\n',
      ];

      const mockBody = createMockReadableStream(mockEvents);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockBody,
      });

      const result = await client.analyzeWithStreaming('test');

      expect(result.blocked).toBe(true);
      expect(result.reasons).toContain('Conversation limit exceeded');
    });

    it('should handle stream_error events', async () => {
      const mockEvents = ['data: {"type":"stream_error","error":"Internal server error"}\n\n'];

      const mockBody = createMockReadableStream(mockEvents);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockBody,
      });

      await expect(client.analyzeWithStreaming('test')).rejects.toThrow('Stream error: Internal server error');
    });

    it('should handle malformed SSE data gracefully', async () => {
      const mockEvents = [
        'data: invalid json\n\n',
        'data: {"type":"guardrail_result","guardrail_id":"test","performance_class":"FAST","result":{"action":"allow","blocked":false,"confidence":1.0,"reason":""},"timestamp":"2024-01-01T00:00:00Z","processing_time_ms":5}\n\n',
        'data: {"type":"stream_complete"}\n\n',
      ];

      const mockBody = createMockReadableStream(mockEvents);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockBody,
      });

      const result = await client.analyzeWithStreaming('test');

      // Should skip the malformed event and process the valid one
      expect(result.guardrailResults).toHaveLength(1);
    });

    it('should build final response correctly', async () => {
      const mockEvents = [
        'data: {"type":"guardrail_result","guardrail_id":"keyword_block","performance_class":"FAST","result":{"action":"allow","blocked":false,"confidence":1.0,"reason":""},"timestamp":"2024-01-01T00:00:00Z","processing_time_ms":5}\n\n',
        'data: {"type":"guardrail_result","guardrail_id":"pii_check","performance_class":"FAST","result":{"action":"warn","blocked":false,"confidence":0.8,"reason":"Possible email"},"timestamp":"2024-01-01T00:00:00Z","processing_time_ms":8}\n\n',
        'data: {"type":"final_response","content":true}\n\n',
        'data: {"type":"stream_complete"}\n\n',
      ];

      const mockBody = createMockReadableStream(mockEvents);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockBody,
      });

      const result = await client.analyzeWithStreaming('test');

      expect(result.finalResponse).toBeDefined();
      expect(result.finalResponse?.action).toBe('warn');
      expect(result.finalResponse?.metadata.guardrails_triggered).toEqual(['keyword_block', 'pii_check']);
      expect(result.finalResponse?.metadata.processing_time_ms).toBe(13);
    });
  });

  describe('configuration', () => {
    it('should update configuration', async () => {
      client.updateConfig({
        baseUrl: 'https://new-api.example.com',
        timeout: 15000,
      });

      // Verify by attempting a request with the new config
      const mockBody = createMockReadableStream(['data: {"type":"stream_complete"}\n\n']);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockBody,
      });

      await client.analyzeWithStreaming('test');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://new-api.example.com/api/v1/stream/analyze',
        expect.any(Object),
      );
    });
  });

  describe('context detection', () => {
    it('should detect different contexts', async () => {
      // Test ChatGPT context
      Object.defineProperty(window.location, 'hostname', {
        value: 'chatgpt.com',
        writable: true,
      });
      
      let testClient = new StingerSSEClient();
      const mockBody = createMockReadableStream(['data: {"type":"stream_complete"}\n\n']);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockBody,
      });

      await testClient.analyzeWithStreaming('test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-User-Context': 'chatgpt',
          }),
        }),
      );

      // Test Claude context
      jest.clearAllMocks();
      Object.defineProperty(window.location, 'hostname', {
        value: 'claude.ai',
        writable: true,
      });
      
      testClient = new StingerSSEClient();
      const mockBody2 = createMockReadableStream(['data: {"type":"stream_complete"}\n\n']);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockBody2,
      });

      await testClient.analyzeWithStreaming('test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-User-Context': 'claude',
          }),
        }),
      );
    });
  });
});

// Helper function to create mock ReadableStream
function createMockReadableStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder() as any;
  let index = 0;

  return {
    getReader: () => ({
      read: async () => {
        if (index < chunks.length) {
          const chunk = chunks[index++];
          return { done: false, value: encoder.encode(chunk) };
        }
        return { done: true, value: undefined };
      },
      releaseLock: () => {},
    }),
  } as any;
}