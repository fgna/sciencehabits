/**
 * Integration Test Setup
 * 
 * Configuration and setup for integration tests that validate
 * the complete CMS system integration.
 */

import '@testing-library/jest-dom';

// Mock localStorage for tests
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage for tests
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock IndexedDB for tests
const indexedDBMock = {
  open: jest.fn(() => Promise.resolve({
    transaction: jest.fn(() => ({
      objectStore: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve()),
        put: jest.fn(() => Promise.resolve()),
        delete: jest.fn(() => Promise.resolve()),
        getAll: jest.fn(() => Promise.resolve([]))
      }))
    }))
  })),
  deleteDatabase: jest.fn(() => Promise.resolve())
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDBMock
});

// Mock console methods for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
});

afterEach(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
global.waitFor = (fn: () => boolean, timeout = 5000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (fn()) {
        resolve();
      } else if (Date.now() - start > timeout) {
        reject(new Error(`Timeout waiting for condition after ${timeout}ms`));
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  });
};

// Mock fetch with realistic network delays
global.fetch = jest.fn();

// Helper to create mock API responses
global.createMockAPIResponse = (data: any, delay = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data))
      });
    }, delay);
  });
};

// Helper to create mock API errors
global.createMockAPIError = (message: string, status = 500, delay = 100) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error(message));
    }, delay);
  });
};

// Mock date for consistent testing
const mockDate = new Date('2025-08-16T10:00:00.000Z');
jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

// Suppress console logs during tests unless explicitly needed
const originalConsoleLog = console.log;
console.log = jest.fn();

// Setup custom matchers for integration tests
expect.extend({
  toBeValidAPIResponse(received) {
    const pass = received && 
                 typeof received.success === 'boolean' &&
                 (received.data !== undefined || received.error !== undefined);
    
    if (pass) {
      return {
        message: () => `Expected ${received} not to be a valid API response`,
        pass: true
      };
    } else {
      return {
        message: () => `Expected ${received} to be a valid API response with success and data/error fields`,
        pass: false
      };
    }
  },
  
  toHaveValidContentStructure(received) {
    const requiredFields = ['id', 'title', 'description', 'language'];
    const hasAllFields = requiredFields.every(field => 
      received && received[field] !== undefined
    );
    
    if (hasAllFields) {
      return {
        message: () => `Expected ${received} not to have valid content structure`,
        pass: true
      };
    } else {
      const missingFields = requiredFields.filter(field => 
        !received || received[field] === undefined
      );
      return {
        message: () => `Expected content to have required fields. Missing: ${missingFields.join(', ')}`,
        pass: false
      };
    }
  }
});

// Type declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidAPIResponse(): R;
      toHaveValidContentStructure(): R;
    }
  }
  
  // Utility function declarations
  var waitFor: (fn: () => boolean, timeout?: number) => Promise<void>;
  var createMockAPIResponse: (data: any, delay?: number) => Promise<any>;
  var createMockAPIError: (message: string, status?: number, delay?: number) => Promise<any>;
}

// Integration test environment setup complete
console.log('🧪 Integration test environment initialized');