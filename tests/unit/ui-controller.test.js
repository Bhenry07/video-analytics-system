/**
 * Unit Tests for UIController Module
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Import UIController
const UIController = (await import('../../public/modules/ui-controller.js')).default;

describe('UIController', () => {
  let uiController;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <select id="videoSelect"></select>
      <button id="uploadBtn"></button>
      <input type="file" id="fileInput" />
      <button id="analyzeBtn"></button>
      <button id="pauseBtn"></button>
      <button id="exportJsonBtn"></button>
      <button id="exportCsvBtn"></button>
      <button id="exportReportBtn"></button>
      <button id="clearDataBtn"></button>
      <input type="range" id="confidenceSlider" />
      <span id="confidenceValue"></span>
      <div id="videoPlayer"></div>
      <div id="detectionCanvas"></div>
      <div id="personCount"></div>
      <div id="vehicleCount"></div>
      <div id="objectCount"></div>
      <div id="fpsDisplay"></div>
      <div id="detectionLog"></div>
      <div id="statusMessage"></div>
      <div id="uploadProgress" style="display:none;">
        <div class="progress-bar"></div>
      </div>
      <div id="loadingOverlay" style="display:none;"></div>
    `;

    uiController = new UIController();
  });

  describe('Constructor', () => {
    test('should initialize with null elements', () => {
      expect(uiController.elements).toEqual({});
    });
  });

  describe('initialize()', () => {
    test('should cache all DOM elements', () => {
      uiController.initialize();

      expect(uiController.elements.videoSelect).not.toBeNull();
      expect(uiController.elements.uploadBtn).not.toBeNull();
      expect(uiController.elements.analyzeBtn).not.toBeNull();
      expect(uiController.elements.confidenceSlider).not.toBeNull();
    });

    test('should throw error if required element missing', () => {
      document.body.innerHTML = '<div></div>';

      expect(() => new UIController().initialize()).toThrow();
    });
  });

  describe('registerCallbacks()', () => {
    beforeEach(() => {
      uiController.initialize();
    });

    test('should register all callbacks', () => {
      const callbacks = {
        onVideoSelect: jest.fn(),
        onUpload: jest.fn(),
        onAnalyze: jest.fn(),
        onPause: jest.fn(),
        onExportJson: jest.fn(),
        onExportCsv: jest.fn(),
        onExportReport: jest.fn(),
        onClearData: jest.fn(),
        onConfidenceChange: jest.fn()
      };

      uiController.registerCallbacks(callbacks);

      // Verify callbacks are stored
      expect(uiController.callbacks.onVideoSelect).toBe(callbacks.onVideoSelect);
    });

    test('should trigger video select callback', () => {
      const onVideoSelect = jest.fn();
      uiController.registerCallbacks({ onVideoSelect });

      const select = uiController.elements.videoSelect;
      select.value = 'test-video.mp4';
      select.dispatchEvent(new Event('change'));

      expect(onVideoSelect).toHaveBeenCalledWith('test-video.mp4');
    });

    test('should trigger analyze callback', () => {
      const onAnalyze = jest.fn();
      uiController.registerCallbacks({ onAnalyze });

      uiController.elements.analyzeBtn.dispatchEvent(new Event('click'));

      expect(onAnalyze).toHaveBeenCalled();
    });

    test('should trigger confidence change callback', () => {
      const onConfidenceChange = jest.fn();
      uiController.registerCallbacks({ onConfidenceChange });

      const slider = uiController.elements.confidenceSlider;
      slider.value = '0.7';
      slider.dispatchEvent(new Event('input'));

      expect(onConfidenceChange).toHaveBeenCalledWith(0.7);
    });
  });

  describe('updateStats()', () => {
    beforeEach(() => {
      uiController.initialize();
    });

    test('should update stat displays', () => {
      uiController.updateStats({
        person: 5,
        vehicle: 3,
        object: 2,
        fps: 30
      });

      expect(uiController.elements.personCount.textContent).toBe('5');
      expect(uiController.elements.vehicleCount.textContent).toBe('3');
      expect(uiController.elements.objectCount.textContent).toBe('2');
      expect(uiController.elements.fpsDisplay.textContent).toBe('30');
    });

    test('should handle missing stats', () => {
      uiController.updateStats({});

      expect(uiController.elements.personCount.textContent).toBe('0');
      expect(uiController.elements.fpsDisplay.textContent).toBe('0');
    });

    test('should format FPS to integer', () => {
      uiController.updateStats({ fps: 29.876 });

      expect(uiController.elements.fpsDisplay.textContent).toBe('30');
    });
  });

  describe('updateLog()', () => {
    beforeEach(() => {
      uiController.initialize();
    });

    test('should add log entry', () => {
      const predictions = [
        { class: 'person', score: 0.9 },
        { class: 'car', score: 0.8 }
      ];
      const categories = { person: 1, vehicle: 1, object: 0 };

      uiController.updateLog('10:30:45', predictions, categories);

      const log = uiController.elements.detectionLog;
      expect(log.children.length).toBe(1);
      expect(log.textContent).toContain('10:30:45');
      expect(log.textContent).toContain('person');
    });

    test('should limit log entries to maxEntries', () => {
      const predictions = [{ class: 'person', score: 0.9 }];
      const categories = { person: 1, vehicle: 0, object: 0 };

      // Add 60 entries (max is 50)
      for (let i = 0; i < 60; i++) {
        uiController.updateLog(`10:${i}:00`, predictions, categories);
      }

      expect(uiController.elements.detectionLog.children.length).toBe(50);
    });

    test('should handle empty predictions', () => {
      uiController.updateLog('10:00:00', [], { person: 0, vehicle: 0, object: 0 });

      const log = uiController.elements.detectionLog;
      expect(log.children.length).toBe(1);
    });
  });

  describe('updateVideosList()', () => {
    beforeEach(() => {
      uiController.initialize();
    });

    test('should populate video dropdown', () => {
      const videos = ['video1.mp4', 'video2.mp4', 'video3.mp4'];

      uiController.updateVideosList(videos);

      const select = uiController.elements.videoSelect;
      expect(select.options.length).toBe(4); // 3 videos + 1 default option
      expect(select.options[1].value).toBe('video1.mp4');
    });

    test('should add delete buttons for each video', () => {
      const videos = ['video1.mp4'];
      const onDeleteVideo = jest.fn();

      uiController.registerCallbacks({ onDeleteVideo });
      uiController.updateVideosList(videos);

      const deleteBtn = document.querySelector('.delete-video-btn');
      expect(deleteBtn).not.toBeNull();
    });

    test('should handle empty videos array', () => {
      uiController.updateVideosList([]);

      const select = uiController.elements.videoSelect;
      expect(select.options.length).toBe(1); // Only default option
    });

    test('should trigger delete callback', () => {
      const videos = ['test.mp4'];
      const onDeleteVideo = jest.fn();

      uiController.registerCallbacks({ onDeleteVideo });
      uiController.updateVideosList(videos);

      const deleteBtn = document.querySelector('.delete-video-btn');
      deleteBtn.dispatchEvent(new Event('click'));

      expect(onDeleteVideo).toHaveBeenCalledWith('test.mp4');
    });
  });

  describe('showStatus()', () => {
    beforeEach(() => {
      uiController.initialize();
    });

    test('should display status message', () => {
      uiController.showStatus('Analysis complete', 'success');

      const status = uiController.elements.statusMessage;
      expect(status.textContent).toBe('Analysis complete');
      expect(status.classList.contains('status-success')).toBe(true);
      expect(status.style.display).not.toBe('none');
    });

    test('should support different status types', () => {
      const types = ['success', 'error', 'warning', 'info'];

      types.forEach((type) => {
        uiController.showStatus(`Test ${type}`, type);
        const status = uiController.elements.statusMessage;
        expect(status.classList.contains(`status-${type}`)).toBe(true);
      });
    });

    test('should hide status after delay', (done) => {
      uiController.showStatus('Test', 'info');

      setTimeout(() => {
        const status = uiController.elements.statusMessage;
        expect(status.style.display).toBe('none');
        done();
      }, 3500);
    });
  });

  describe('showUploadProgress()', () => {
    beforeEach(() => {
      uiController.initialize();
    });

    test('should show progress bar', () => {
      uiController.showUploadProgress(50);

      const container = uiController.elements.uploadProgress;
      expect(container.style.display).not.toBe('none');

      const bar = container.querySelector('.progress-bar');
      expect(bar.style.width).toBe('50%');
    });

    test('should update progress value', () => {
      uiController.showUploadProgress(0);
      uiController.showUploadProgress(25);
      uiController.showUploadProgress(75);

      const bar = uiController.elements.uploadProgress.querySelector('.progress-bar');
      expect(bar.style.width).toBe('75%');
    });

    test('should hide progress at 100%', (done) => {
      uiController.showUploadProgress(100);

      setTimeout(() => {
        const container = uiController.elements.uploadProgress;
        expect(container.style.display).toBe('none');
        done();
      }, 600);
    });
  });

  describe('toggleLoading()', () => {
    beforeEach(() => {
      uiController.initialize();
    });

    test('should show loading overlay', () => {
      uiController.toggleLoading(true, 'Loading model...');

      const overlay = uiController.elements.loadingOverlay;
      expect(overlay.style.display).not.toBe('none');
      expect(overlay.textContent).toContain('Loading model...');
    });

    test('should hide loading overlay', () => {
      uiController.toggleLoading(true, 'Loading...');
      uiController.toggleLoading(false);

      const overlay = uiController.elements.loadingOverlay;
      expect(overlay.style.display).toBe('none');
    });
  });

  describe('setButtonState()', () => {
    beforeEach(() => {
      uiController.initialize();
    });

    test('should enable button', () => {
      uiController.setButtonState('analyzeBtn', true);

      expect(uiController.elements.analyzeBtn.disabled).toBe(false);
    });

    test('should disable button', () => {
      uiController.setButtonState('analyzeBtn', false);

      expect(uiController.elements.analyzeBtn.disabled).toBe(true);
    });

    test('should handle multiple buttons', () => {
      uiController.setButtonState('analyzeBtn', false);
      uiController.setButtonState('pauseBtn', false);
      uiController.setButtonState('uploadBtn', true);

      expect(uiController.elements.analyzeBtn.disabled).toBe(true);
      expect(uiController.elements.pauseBtn.disabled).toBe(true);
      expect(uiController.elements.uploadBtn.disabled).toBe(false);
    });
  });

  describe('clearLog()', () => {
    beforeEach(() => {
      uiController.initialize();
    });

    test('should clear detection log', () => {
      const predictions = [{ class: 'person', score: 0.9 }];
      const categories = { person: 1, vehicle: 0, object: 0 };

      uiController.updateLog('10:00:00', predictions, categories);
      expect(uiController.elements.detectionLog.children.length).toBe(1);

      uiController.clearLog();
      expect(uiController.elements.detectionLog.children.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      uiController.initialize();
    });

    test('should handle very large numbers in stats', () => {
      uiController.updateStats({
        person: 999999,
        vehicle: 888888,
        object: 777777,
        fps: 1000
      });

      expect(uiController.elements.personCount.textContent).toBe('999999');
    });

    test('should handle negative progress values', () => {
      expect(() => uiController.showUploadProgress(-10)).not.toThrow();
    });

    test('should handle progress > 100%', () => {
      uiController.showUploadProgress(150);

      const bar = uiController.elements.uploadProgress.querySelector('.progress-bar');
      expect(bar.style.width).toBe('150%'); // Let CSS handle overflow
    });

    test('should handle callback without function', () => {
      expect(() => {
        uiController.registerCallbacks({ onAnalyze: null });
        uiController.elements.analyzeBtn.dispatchEvent(new Event('click'));
      }).not.toThrow();
    });
  });
});
