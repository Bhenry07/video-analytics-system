/**
 * Centralized error handling module for the Video Analytics System
 * Provides consistent error logging, user notifications, and error tracking
 * @module ErrorHandler
 */

class ErrorHandler {
  /**
   * Handle an error with context and user notification
   * @param {Error} error - The error object
   * @param {string} context - Context where the error occurred (e.g., 'Model Loading', 'Video Upload')
   * @param {boolean} showToUser - Whether to show error to user (default: true)
   */
  static handle(error, context, showToUser = true) {
    // Log to console with context
    console.error(`[${context}]`, error);

    // Show user-friendly message
    if (showToUser) {
      this.showUserMessage(error, context);
    }

    // Store error log for debugging
    this.logError(error, context);
  }

  /**
   * Show user-friendly error message
   * @param {Error} error - The error object
   * @param {string} context - Context of the error
   */
  static showUserMessage(error, context) {
    const message = this.getUserFriendlyMessage(error, context);
    this.showToast(message, 'error');
  }

  /**
   * Convert technical error to user-friendly message
   * @param {Error} error - The error object
   * @param {string} context - Context of the error
   * @returns {string} User-friendly error message
   */
  static getUserFriendlyMessage(error, context) {
    const messages = {
      'Model Loading':
        'Failed to load AI model. Please check your internet connection and try again.',
      'Video Upload':
        'Failed to upload video. Please ensure the file is a valid video format and try again.',
      'Video Detection':
        'Detection error occurred. Try reloading the video or reducing detection FPS.',
      'Video Playback':
        'Failed to load video. The file may be corrupted or in an unsupported format.',
      'Data Export': 'Failed to export data. Please try again.',
      'Video Deletion': 'Failed to delete video. Please try again.'
    };

    return messages[context] || `An error occurred: ${error.message}`;
  }

  /**
   * Display toast notification to user
   * @param {string} message - Message to display
   * @param {string} type - Type of message ('error', 'success', 'warning', 'info')
   */
  static showToast(message, type = 'info') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.error-toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `error-toast error-toast-${type}`;
    toast.innerHTML = `
            <div class="error-toast-content">
                <span class="error-toast-icon">${this.getIconForType(type)}</span>
                <span class="error-toast-message">${message}</span>
                <button class="error-toast-close" onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
        `;

    document.body.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('error-toast-fade-out');
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  }

  /**
   * Get icon for toast type
   * @param {string} type - Toast type
   * @returns {string} Icon emoji
   */
  static getIconForType(type) {
    const icons = {
      error: '❌',
      success: '✅',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || '•';
  }

  /**
   * Log error to localStorage for debugging
   * @param {Error} error - The error object
   * @param {string} context - Context of the error
   */
  static logError(error, context) {
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        context: context,
        message: error.message,
        stack: error.stack,
        userAgent: navigator.userAgent
      };

      // Get existing logs
      const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]');

      // Add new log
      logs.push(errorLog);

      // Keep only last 50 errors
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }

      // Save back to localStorage
      localStorage.setItem('errorLogs', JSON.stringify(logs));
    } catch (e) {
      // If localStorage fails, just log to console
      console.warn('Failed to save error log:', e);
    }
  }

  /**
   * Get all stored error logs
   * @returns {Array} Array of error log objects
   */
  static getErrorLogs() {
    try {
      return JSON.parse(localStorage.getItem('errorLogs') || '[]');
    } catch (e) {
      console.warn('Failed to retrieve error logs:', e);
      return [];
    }
  }

  /**
   * Clear all error logs
   */
  static clearErrorLogs() {
    try {
      localStorage.removeItem('errorLogs');
    } catch (e) {
      console.warn('Failed to clear error logs:', e);
    }
  }

  /**
   * Validate a value meets requirements
   * @param {*} value - Value to validate
   * @param {Object} rules - Validation rules
   * @param {string} fieldName - Name of field being validated
   * @throws {Error} If validation fails
   */
  static validate(value, rules, fieldName) {
    // Required check
    if (rules.required && (value === null || value === undefined || value === '')) {
      throw new Error(`${fieldName} is required`);
    }

    // Type check
    if (rules.type && typeof value !== rules.type) {
      throw new Error(`${fieldName} must be of type ${rules.type}`);
    }

    // Min/max for numbers
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        throw new Error(`${fieldName} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        throw new Error(`${fieldName} must be at most ${rules.max}`);
      }
    }

    // Min/max length for strings
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        throw new Error(`${fieldName} must be at least ${rules.minLength} characters`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        throw new Error(`${fieldName} must be at most ${rules.maxLength} characters`);
      }
    }

    // Custom validator function
    if (rules.validator && typeof rules.validator === 'function') {
      const result = rules.validator(value);
      if (result !== true) {
        throw new Error(result || `${fieldName} is invalid`);
      }
    }
  }

  /**
   * Show success message to user
   * @param {string} message - Success message
   */
  static showSuccess(message) {
    this.showToast(message, 'success');
  }

  /**
   * Show warning message to user
   * @param {string} message - Warning message
   */
  static showWarning(message) {
    this.showToast(message, 'warning');
  }

  /**
   * Show info message to user
   * @param {string} message - Info message
   */
  static showInfo(message) {
    this.showToast(message, 'info');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorHandler;
}
