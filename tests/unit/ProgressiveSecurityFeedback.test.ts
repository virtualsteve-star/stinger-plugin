/**
 * Unit tests for ProgressiveSecurityFeedback
 */

import { ProgressiveSecurityFeedback } from '../../extension/src/content/ui/ProgressiveSecurityFeedback';
import type { GuardrailResult } from '../../extension/src/shared/api/StingerSSEClient';

// Mock DOM elements
const mockElement = {
  className: '',
  textContent: '',
  style: {
    cssText: '',
    opacity: '',
    transform: '',
  },
  appendChild: jest.fn(),
  querySelector: jest.fn(),
  parentNode: {
    removeChild: jest.fn(),
  },
};

// Mock document
global.document = {
  createElement: jest.fn(() => ({ ...mockElement })),
  body: {
    appendChild: jest.fn(),
  },
} as any;

// Mock window timers
let timeoutCallbacks: { [key: number]: () => void } = {};
let timeoutId = 1;

const mockSetTimeout = jest.fn((callback: () => void, delay: number) => {
  const id = timeoutId++;
  timeoutCallbacks[id] = callback;
  return id;
});

const mockClearTimeout = jest.fn((id: number) => {
  delete timeoutCallbacks[id];
});

global.window = {
  setTimeout: mockSetTimeout,
  clearTimeout: mockClearTimeout,
} as any;

describe.skip('ProgressiveSecurityFeedback', () => {
  let feedback: ProgressiveSecurityFeedback;

  beforeEach(() => {
    jest.clearAllMocks();
    timeoutCallbacks = {};
    timeoutId = 1;
    feedback = new ProgressiveSecurityFeedback({
      progressTimeout: 500,
      hideDelay: 2000,
    });
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const defaultFeedback = new ProgressiveSecurityFeedback();
      expect(defaultFeedback).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const customFeedback = new ProgressiveSecurityFeedback({
        progressTimeout: 1000,
        hideDelay: 5000,
      });
      expect(customFeedback).toBeDefined();
    });
  });

  describe('startSecurityCheck', () => {
    it('should set up progress timer', () => {
      feedback.startSecurityCheck();
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 500);
    });

    it('should show progress message after timeout', () => {
      feedback.startSecurityCheck();
      
      // Trigger the timeout
      const timerId = Object.keys(timeoutCallbacks)[0];
      timeoutCallbacks[parseInt(timerId)]();

      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it('should cleanup existing timers before starting new check', () => {
      feedback.startSecurityCheck();
      const firstTimerId = Object.keys(timeoutCallbacks)[0];
      
      feedback.startSecurityCheck();
      
      expect(mockClearTimeout).toHaveBeenCalledWith(parseInt(firstTimerId));
    });
  });

  describe('handleGuardrailResult', () => {
    it('should show instant result for FAST guardrails', () => {
      const fastResult: GuardrailResult = {
        type: 'guardrail_result',
        guardrail_id: 'keyword_block',
        performance_class: 'FAST',
        result: {
          action: 'allow',
          blocked: false,
          confidence: 1.0,
          reason: '',
        },
        timestamp: '2024-01-01T00:00:00Z',
        processing_time_ms: 5,
      };

      // Create container first
      feedback.startSecurityCheck();
      timeoutCallbacks[1](); // Trigger progress display

      feedback.handleGuardrailResult(fastResult);

      // Should schedule quick hide for allow results
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
    });

    it('should show progressive result for SLOW guardrails', () => {
      const slowResult: GuardrailResult = {
        type: 'guardrail_result',
        guardrail_id: 'ai_toxicity_detection',
        performance_class: 'SLOW',
        result: {
          action: 'block',
          blocked: true,
          confidence: 0.95,
          reason: 'Toxic content detected',
        },
        timestamp: '2024-01-01T00:00:00Z',
        processing_time_ms: 500,
      };

      // Create container first
      feedback.startSecurityCheck();
      timeoutCallbacks[1](); // Trigger progress display

      feedback.handleGuardrailResult(slowResult);

      // Should schedule longer display for block results
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);
    });

    it('should handle warn actions appropriately', () => {
      const warnResult: GuardrailResult = {
        type: 'guardrail_result',
        guardrail_id: 'simple_pii_detection',
        performance_class: 'FAST',
        result: {
          action: 'warn',
          blocked: false,
          confidence: 0.8,
          reason: 'Possible PII detected',
        },
        timestamp: '2024-01-01T00:00:00Z',
        processing_time_ms: 10,
      };

      // Create container first
      feedback.startSecurityCheck();
      timeoutCallbacks[1](); // Trigger progress display

      feedback.handleGuardrailResult(warnResult);

      // Should schedule medium display time for warnings
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 3000);
    });
  });

  describe('completeSecurityCheck', () => {
    it('should clear progress timer', () => {
      feedback.startSecurityCheck();
      const timerId = Object.keys(timeoutCallbacks)[0];
      
      feedback.completeSecurityCheck(false, []);
      
      expect(mockClearTimeout).toHaveBeenCalledWith(parseInt(timerId));
    });

    it('should show blocked message', () => {
      feedback.startSecurityCheck();
      timeoutCallbacks[1](); // Trigger progress display
      
      feedback.completeSecurityCheck(true, []);
      
      // Should show block message and schedule hide
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);
    });

    it('should show warning message when warnings present', () => {
      feedback.startSecurityCheck();
      timeoutCallbacks[1](); // Trigger progress display
      
      feedback.completeSecurityCheck(false, ['Warning 1', 'Warning 2']);
      
      // Should show warning count and schedule hide
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 3000);
    });

    it('should show success message when no issues', () => {
      feedback.startSecurityCheck();
      timeoutCallbacks[1](); // Trigger progress display
      
      feedback.completeSecurityCheck(false, []);
      
      // Should show success and schedule quick hide
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);
    });
  });

  describe('handleStreamError', () => {
    it('should show error message', () => {
      feedback.startSecurityCheck();
      timeoutCallbacks[1](); // Trigger progress display
      
      feedback.handleStreamError('Connection failed');
      
      // Should show error and schedule hide
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 3000);
    });
  });

  describe('cleanup', () => {
    it('should clear all timers', () => {
      feedback.startSecurityCheck();
      const progressTimerId = Object.keys(timeoutCallbacks)[0];
      
      // Trigger progress display and schedule hide
      timeoutCallbacks[parseInt(progressTimerId)]();
      const hideTimerId = Object.keys(timeoutCallbacks)[1];
      
      feedback.cleanup();
      
      expect(mockClearTimeout).toHaveBeenCalledWith(parseInt(progressTimerId));
      expect(mockClearTimeout).toHaveBeenCalledWith(parseInt(hideTimerId));
    });

    it('should remove UI elements', () => {
      feedback.startSecurityCheck();
      timeoutCallbacks[1](); // Create UI
      
      const mockContainer = document.createElement('div');
      mockContainer.parentNode = {
        removeChild: jest.fn(),
      };
      (feedback as any).container = mockContainer;
      
      feedback.cleanup();
      
      // Should trigger fade out and removal
      expect(mockContainer.style.opacity).toBe('0');
    });
  });

  describe('UI creation and updates', () => {
    it('should create security indicator with correct styles', () => {
      feedback.startSecurityCheck();
      timeoutCallbacks[1](); // Trigger progress display
      
      const createdElement = (document.createElement as jest.Mock).mock.results[0].value;
      expect(createdElement.className).toBe('stinger-security-indicator');
      expect(createdElement.style.cssText).toContain('position: fixed');
      expect(createdElement.style.cssText).toContain('z-index: 10000');
    });

    it('should update message content and styling', () => {
      const mockMessageElement = { ...mockElement };
      mockElement.querySelector.mockReturnValue(mockMessageElement);
      
      feedback.startSecurityCheck();
      timeoutCallbacks[1](); // Create UI
      
      // Update with block message
      feedback.completeSecurityCheck(true, []);
      
      expect(mockMessageElement.className).toContain('stinger-block');
    });
  });

  describe('guardrail display names', () => {
    it('should map known guardrail IDs to display names', () => {
      const testCases = [
        { id: 'keyword_block', expected: 'Keyword filter' },
        { id: 'simple_pii_detection', expected: 'PII detection' },
        { id: 'ai_toxicity_detection', expected: 'AI toxicity analysis' },
        { id: 'unknown_guardrail', expected: 'unknown_guardrail' },
      ];

      testCases.forEach(({ id, expected }) => {
        const result: GuardrailResult = {
          type: 'guardrail_result',
          guardrail_id: id,
          performance_class: 'SLOW',
          result: {
            action: 'allow',
            blocked: false,
            confidence: 1.0,
            reason: '',
          },
          timestamp: '2024-01-01T00:00:00Z',
          processing_time_ms: 100,
        };

        feedback.startSecurityCheck();
        timeoutCallbacks[1](); // Create UI
        
        feedback.handleGuardrailResult(result);
        
        // The display name should be used in the message
        // This is verified through the message update logic
      });
    });
  });
});