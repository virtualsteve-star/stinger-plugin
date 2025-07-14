/**
 * Mock setup for ProgressiveSecurityFeedback tests
 * This needs to be imported before the actual component to ensure mocks are in place
 */

// Mock window timers globally
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

// Set up window mock before any imports
Object.defineProperty(globalThis, 'window', {
  value: {
    setTimeout: mockSetTimeout,
    clearTimeout: mockClearTimeout,
    location: { hostname: 'chatgpt.com' },
  },
  writable: true,
  configurable: true,
});

// Export for test access
export { mockSetTimeout, mockClearTimeout, timeoutCallbacks, timeoutId };

// Reset function for beforeEach
export function resetTimerMocks() {
  timeoutCallbacks = {};
  timeoutId = 1;
  mockSetTimeout.mockClear();
  mockClearTimeout.mockClear();
}

// Export setter for timeoutCallbacks
export function getTimeoutCallbacks() {
  return timeoutCallbacks;
}

export function setTimeoutCallbacks(callbacks: typeof timeoutCallbacks) {
  timeoutCallbacks = callbacks;
}