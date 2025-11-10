/**
 * Jest Configuration
 * Testing setup for Video Analytics System
 */

export default {
  // Test environment
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // ES Modules support
  extensionsToTreatAsEsm: ['.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/__mocks__/styleMock.js'
  },

  // Transform configuration
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.json' }]
  },

  // Coverage configuration
  collectCoverageFrom: [
    'public/**/*.js',
    '!public/modules/README.md',
    '!public/app.js', // Legacy file
    '!**/node_modules/**',
    '!**/vendor/**'
  ],

  // Coverage thresholds (reduced for initial setup)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },

  // Test match patterns
  testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.spec.js'],

  // Module paths
  moduleDirectories: ['node_modules', 'public'],

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Verbose output
  verbose: true,

  // Ignore transform for node_modules except specific packages if needed
  transformIgnorePatterns: ['node_modules/(?!(chalk)/)']
};
