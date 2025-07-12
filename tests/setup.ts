// Jest setup file for Chrome extension testing

// Mock import.meta for Vite
(global as any).importMeta = {
  env: {
    VITE_STINGER_API_URL: 'http://localhost:8888',
    VITE_API_TIMEOUT: '2000',
    VITE_DEBUG_MODE: 'false',
    VITE_LOG_LEVEL: 'info',
  },
};

// Add fetch API polyfills for jsdom
import 'whatwg-fetch';
global.Response = Response;
global.Request = Request;
global.Headers = Headers;

// Mock AbortController if not available
if (!global.AbortController) {
  global.AbortController = class AbortController {
    signal = {
      aborted: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    abort() {
      this.signal.aborted = true;
      // Trigger abort event for any listeners
      this.signal.addEventListener.mock.calls.forEach(([type, handler]) => {
        if (type === 'abort') {
          handler();
        }
      });
    }
  } as any;
}

// Mock crypto API
if (!global.crypto) {
  global.crypto = {} as any;
}
if (!global.crypto.subtle) {
  global.crypto.subtle = {
    digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
  } as any;
}

// Mock Chrome API
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
    },
    onInstalled: {
      addListener: jest.fn(),
    },
    lastError: null,
    id: 'test-extension-id',
    getURL: jest.fn((path) => `chrome-extension://test-extension-id/${path}`),
  },
  storage: {
    local: {
      get: jest.fn((keys, callback) => callback && callback({})),
      set: jest.fn((items, callback) => callback && callback()),
      remove: jest.fn((keys, callback) => callback && callback()),
      clear: jest.fn((callback) => callback && callback()),
      getBytesInUse: jest.fn((keys, callback) => callback && callback(0)),
    },
  },
  tabs: {
    sendMessage: jest.fn(),
    query: jest.fn((queryInfo, callback) => callback && callback([])),
  },
  alarms: {
    create: jest.fn((name, alarmInfo, callback) => callback && callback()),
    get: jest.fn((name, callback) => callback && callback(undefined)),
    clear: jest.fn((name, callback) => callback && callback(true)),
    clearAll: jest.fn((callback) => callback && callback(true)),
    getAll: jest.fn((callback) => callback && callback([])),
  },
} as any;