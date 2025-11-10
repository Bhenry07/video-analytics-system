/**
 * Unit Tests for ErrorHandler Module
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock DOM for tests
document.body.innerHTML = '<div id="app"></div>';

// Import the ErrorHandler class
const ErrorHandler = (await import('../../public/modules/error-handler.js')).default;

describe('ErrorHandler', () => {
  let errorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
    document.body.innerHTML = '<div id="app"></div>';
    localStorage.clear();
  });

  describe('Constructor', () => {
    test('should initialize with correct default properties', () => {
      expect(errorHandler.errorLog).toEqual([]);
      expect(errorHandler.maxLogSize).toBe(50);
    });

    test('should accept custom maxLogSize', () => {
      const customHandler = new ErrorHandler(100);
      expect(customHandler.maxLogSize).toBe(100);
    });
  });

  describe('handle()', () => {
    test('should handle Error objects correctly', () => {
      const error = new Error('Test error');
      const result = errorHandler.handle(error, 'TestContext');

      expect(result).toEqual({
        message: 'Test error',
        context: 'TestContext',
        timestamp: expect.any(Number)
      });
    });

    test('should handle string errors', () => {
      const result = errorHandler.handle('String error', 'TestContext');

      expect(result.message).toBe('String error');
      expect(result.context).toBe('TestContext');
    });

    test('should handle object errors', () => {
      const error = { message: 'Object error', code: 500 };
      const result = errorHandler.handle(error, 'TestContext');

      expect(result.message).toContain('Object error');
    });

    test('should log errors to errorLog', () => {
      errorHandler.handle(new Error('Test'), 'Context');

      expect(errorHandler.errorLog.length).toBe(1);
      expect(errorHandler.errorLog[0].context).toBe('Context');
    });

    test('should respect maxLogSize', () => {
      const handler = new ErrorHandler(3);

      for (let i = 0; i < 5; i++) {
        handler.handle(new Error(`Error ${i}`), 'Context');
      }

      expect(handler.errorLog.length).toBe(3);
    });

    test('should show toast when showToUser is true', () => {
      const showToastSpy = jest.spyOn(errorHandler, 'showToast');

      errorHandler.handle(new Error('Test'), 'Context', true);

      expect(showToastSpy).toHaveBeenCalledWith(expect.stringContaining('Test'), 'error');
    });
  });

  describe('showToast()', () => {
    test('should create toast element', () => {
      errorHandler.showToast('Test message', 'success');

      const toast = document.querySelector('.toast');
      expect(toast).not.toBeNull();
      expect(toast.textContent).toBe('Test message');
      expect(toast.classList.contains('toast-success')).toBe(true);
    });

    test('should support different toast types', () => {
      const types = ['success', 'error', 'warning', 'info'];

      types.forEach((type) => {
        errorHandler.showToast(`${type} message`, type);
        const toast = document.querySelector(`.toast-${type}`);
        expect(toast).not.toBeNull();
      });
    });

    test('should remove toast after delay', (done) => {
      errorHandler.showToast('Test', 'info');

      const toast = document.querySelector('.toast');
      expect(toast).not.toBeNull();

      setTimeout(() => {
        const toastAfter = document.querySelector('.toast');
        expect(toastAfter).toBeNull();
        done();
      }, 3500);
    });
  });

  describe('validate()', () => {
    test('should validate required fields', () => {
      const result = errorHandler.validate('', { required: true }, 'username');

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('required');
    });

    test('should validate minLength', () => {
      const result = errorHandler.validate('ab', { minLength: 3 }, 'password');

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('at least 3');
    });

    test('should validate maxLength', () => {
      const result = errorHandler.validate('abcdefghij', { maxLength: 5 }, 'code');

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('no more than 5');
    });

    test('should validate min value', () => {
      const result = errorHandler.validate(5, { min: 10 }, 'score');

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('at least 10');
    });

    test('should validate max value', () => {
      const result = errorHandler.validate(100, { max: 50 }, 'age');

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('no more than 50');
    });

    test('should validate pattern (regex)', () => {
      const result = errorHandler.validate(
        'invalid-email',
        // eslint-disable-next-line no-useless-escape
        { pattern: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/ },
        'email'
      );

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('format');
    });

    test('should pass valid input', () => {
      const result = errorHandler.validate(
        'valid@email.com',
        {
          required: true,
          minLength: 5,
          maxLength: 50,
          // eslint-disable-next-line no-useless-escape
          pattern: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
        },
        'email'
      );

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('should validate multiple rules at once', () => {
      const result = errorHandler.validate(
        '',
        {
          required: true,
          minLength: 5
        },
        'field'
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('logError()', () => {
    test('should add error to log', () => {
      const error = new Error('Test error');
      errorHandler.logError(error, 'TestContext');

      expect(errorHandler.errorLog.length).toBe(1);
      expect(errorHandler.errorLog[0]).toEqual({
        message: 'Test error',
        context: 'TestContext',
        timestamp: expect.any(Number),
        stack: expect.any(String)
      });
    });

    test('should save to localStorage', () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

      errorHandler.logError(new Error('Test'), 'Context');

      expect(setItemSpy).toHaveBeenCalledWith('videoAnalytics_errorLog', expect.any(String));
    });

    test('should maintain FIFO queue when maxLogSize exceeded', () => {
      const handler = new ErrorHandler(3);

      handler.logError(new Error('Error 1'), 'C1');
      handler.logError(new Error('Error 2'), 'C2');
      handler.logError(new Error('Error 3'), 'C3');
      handler.logError(new Error('Error 4'), 'C4');

      expect(handler.errorLog.length).toBe(3);
      expect(handler.errorLog[0].message).toBe('Error 2');
      expect(handler.errorLog[2].message).toBe('Error 4');
    });
  });

  describe('getErrorLog()', () => {
    test('should return copy of error log', () => {
      errorHandler.logError(new Error('Test'), 'Context');

      const log = errorHandler.getErrorLog();

      expect(log).toEqual(errorHandler.errorLog);
      expect(log).not.toBe(errorHandler.errorLog); // Different reference
    });

    test('should return empty array when no errors', () => {
      const log = errorHandler.getErrorLog();

      expect(log).toEqual([]);
    });
  });

  describe('clearErrorLog()', () => {
    test('should clear error log', () => {
      errorHandler.logError(new Error('Test 1'), 'C1');
      errorHandler.logError(new Error('Test 2'), 'C2');

      expect(errorHandler.errorLog.length).toBe(2);

      errorHandler.clearErrorLog();

      expect(errorHandler.errorLog.length).toBe(0);
    });

    test('should clear localStorage', () => {
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');

      errorHandler.clearErrorLog();

      expect(removeItemSpy).toHaveBeenCalledWith('videoAnalytics_errorLog');
    });
  });

  describe('Edge Cases', () => {
    test('should handle null error', () => {
      const result = errorHandler.handle(null, 'Context');

      expect(result.message).toBe('An unknown error occurred');
    });

    test('should handle undefined error', () => {
      const result = errorHandler.handle(undefined, 'Context');

      expect(result.message).toBe('An unknown error occurred');
    });

    test('should handle empty string validation', () => {
      const result = errorHandler.validate('', { required: false }, 'field');

      expect(result.isValid).toBe(true);
    });

    test('should handle validation without rules', () => {
      const result = errorHandler.validate('test', {}, 'field');

      expect(result.isValid).toBe(true);
    });
  });
});
