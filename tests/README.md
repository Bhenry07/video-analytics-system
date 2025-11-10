# Testing Documentation

## Overview

This directory contains comprehensive test suites for the Video Analytics System. The tests are organized into unit tests and integration tests to ensure code quality and system reliability.

## Test Structure

```
tests/
├── __mocks__/           # Mock implementations
│   └── styleMock.js     # CSS import mock
├── unit/                # Unit tests for individual modules
│   ├── error-handler.test.js
│   ├── detection-engine.test.js
│   ├── chart-manager.test.js
│   ├── data-exporter.test.js
│   └── ui-controller.test.js
├── integration/         # Integration tests
│   └── system-integration.test.js
└── setup.js            # Global test setup
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Specific Test File

```bash
npm test -- error-handler.test.js
```

### Run Tests Matching Pattern

```bash
npm test -- --testNamePattern="should handle"
```

## Test Coverage

Current coverage targets:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

View detailed coverage report:

1. Run `npm run test:coverage`
2. Open `coverage/lcov-report/index.html` in browser

## Unit Tests

### ErrorHandler Tests (`error-handler.test.js`)

Tests for centralized error handling:

- Error handling for different error types (Error, string, object)
- Toast notification display
- Input validation with various rules
- Error logging with size limits
- localStorage integration

**Key Test Cases:**

- Valid/invalid input validation
- Error log FIFO queue behavior
- Toast auto-dismiss timing
- Multiple validation rules

### DetectionEngine Tests (`detection-engine.test.js`)

Tests for AI model and detection logic:

- COCO-SSD model loading
- Frame detection with video element
- Prediction filtering (confidence, class)
- Object categorization
- FPS calculation

**Key Test Cases:**

- Model initialization
- Detection with various thresholds
- Category counting
- Configuration updates

### ChartManager Tests (`chart-manager.test.js`)

Tests for data visualization:

- Chart.js initialization
- Data point addition
- Data sampling for performance
- Statistics calculation
- Chart updates

**Key Test Cases:**

- Max data points enforcement
- Statistical calculations (avg, max)
- Data sampling algorithm
- Chart cleanup

### DataExporter Tests (`data-exporter.test.js`)

Tests for data export functionality:

- JSON export with metadata
- CSV export with proper formatting
- Summary report generation
- Statistics calculation
- File download simulation

**Key Test Cases:**

- Export format validation
- Statistics accuracy
- Large dataset handling
- Special character escaping

### UIController Tests (`ui-controller.test.js`)

Tests for UI management:

- DOM element caching
- Event handler registration
- UI updates (stats, log, status)
- Button state management
- Progress indicators

**Key Test Cases:**

- Callback registration and triggering
- Video list population
- Log entry limits
- Progress bar updates

## Integration Tests

### System Integration Tests (`system-integration.test.js`)

Tests for module interactions:

- Complete analysis workflow
- Data flow between modules
- Error propagation
- Configuration changes
- Data consistency
- Memory management

**Key Test Cases:**

- End-to-end detection pipeline
- Module communication
- Cross-module error handling
- Data integrity across modules

## Mocks and Setup

### Global Setup (`setup.js`)

- Console method mocking
- localStorage/sessionStorage mocks
- requestAnimationFrame mock
- Performance API mock
- beforeEach cleanup

### Style Mock (`__mocks__/styleMock.js`)

- CSS import mock for Jest

## Writing New Tests

### Test Structure Template

```javascript
import { describe, test, expect, beforeEach, jest } from '@jest/globals';

describe('ModuleName', () => {
  let module;

  beforeEach(() => {
    // Setup
    module = new ModuleName();
    jest.clearAllMocks();
  });

  describe('methodName()', () => {
    test('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = module.methodName(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Best Practices

1. **Arrange-Act-Assert Pattern**: Structure tests clearly
2. **Test One Thing**: Each test should verify one behavior
3. **Descriptive Names**: Use clear test descriptions
4. **Mock External Dependencies**: Isolate unit under test
5. **Test Edge Cases**: Include boundary and error conditions
6. **Clean Up**: Reset state in beforeEach/afterEach
7. **Avoid Test Interdependence**: Tests should run independently

## Common Testing Patterns

### Testing Async Functions

```javascript
test('should load model asynchronously', async () => {
  await engine.loadModel();
  expect(engine.isModelReady()).toBe(true);
});
```

### Testing Callbacks

```javascript
test('should trigger callback', () => {
  const callback = jest.fn();
  component.registerCallback(callback);

  component.triggerEvent();

  expect(callback).toHaveBeenCalledWith(expectedArgs);
});
```

### Testing DOM Manipulation

```javascript
test('should update DOM element', () => {
  component.updateDisplay('New Text');

  const element = document.getElementById('target');
  expect(element.textContent).toBe('New Text');
});
```

### Testing Error Handling

```javascript
test('should throw error on invalid input', () => {
  expect(() => {
    component.process(null);
  }).toThrow('Invalid input');
});
```

## Continuous Integration

Tests are run automatically on:

- Pre-commit (via Husky hooks)
- Pull requests
- Main branch pushes

## Troubleshooting

### Tests Timing Out

- Increase timeout: `jest.setTimeout(10000)`
- Check for unresolved promises
- Verify async/await usage

### Mock Not Working

- Ensure mock is defined before import
- Check mock is in correct scope
- Verify jest.clearAllMocks() in beforeEach

### Coverage Not Meeting Threshold

- Run with `--coverage` to see uncovered lines
- Add tests for edge cases
- Test error paths

### DOM Not Found

- Add element to document.body in beforeEach
- Check element IDs match
- Verify setup.js is loaded

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/)
- [TensorFlow.js Testing](https://www.tensorflow.org/js/guide/testing)
- [Chart.js Testing](https://www.chartjs.org/docs/latest/)

## Contributing

When adding new features:

1. Write tests first (TDD)
2. Ensure all tests pass
3. Maintain coverage thresholds
4. Update this documentation
5. Add test examples for complex features
