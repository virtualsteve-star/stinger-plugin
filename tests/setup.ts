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