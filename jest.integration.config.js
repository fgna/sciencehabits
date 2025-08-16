/**
 * Jest Configuration for Integration Tests
 * 
 * Specialized configuration for running integration tests that validate
 * cross-system communication and data flow.
 */

module.exports = {
  displayName: 'Integration Tests',
  testMatch: ['<rootDir>/src/tests/integration/**/*.test.ts'],
  testEnvironment: 'jsdom',
  
  // Setup files from react-scripts  
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTests.js',
    '<rootDir>/src/tests/setup/integration-setup.ts'
  ],
  
  // Use react-scripts transform configuration
  transform: {
    '^.+\\.(js|jsx|mjs|cjs|ts|tsx)$': '<rootDir>/node_modules/react-scripts/config/jest/babelTransform.js',
    '^.+\\.css$': '<rootDir>/node_modules/react-scripts/config/jest/cssTransform.js',
    '^(?!.*\\.(js|jsx|mjs|cjs|ts|tsx|css|json)$)': '<rootDir>/node_modules/react-scripts/config/jest/fileTransform.js'
  },
  
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|mjs|cjs|ts|tsx)$',
    '^.+\\.module\\.(css|sass|scss)$'
  ],
  
  // Module name mapping
  moduleNameMapper: {
    '^react-native$': 'react-native-web',
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy'
  },
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/services/admin/**/*.ts',
    'src/services/cms/**/*.ts', 
    'src/components/admin/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**/*'
  ],
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // File extensions
  moduleFileExtensions: [
    'web.js', 'js', 'web.ts', 'ts', 'web.tsx', 'tsx', 'json', 'web.jsx', 'jsx'
  ],
  
  // Timeout for integration tests
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Watch plugins from react-scripts
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  resetMocks: true
};