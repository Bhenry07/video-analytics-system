/**
 * Integration Tests for Video Analytics System
 * Tests the interaction between all modules
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Setup mocks
global.cocoSsd = {
  load: jest.fn(() =>
    Promise.resolve({
      detect: jest.fn(() =>
        Promise.resolve([{ class: 'person', score: 0.9, bbox: [10, 10, 100, 100] }])
      )
    })
  )
};

class MockChart {
  constructor(ctx, config) {
    this.data = config.data;
  }
  update() {}
  destroy() {}
}
global.Chart = MockChart;

HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  clearRect: jest.fn(),
  strokeRect: jest.fn(),
  fillText: jest.fn(),
  beginPath: jest.fn(),
  rect: jest.fn(),
  stroke: jest.fn()
}));

global.URL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn()
};

// Import modules
const ErrorHandler = (await import('../../public/modules/error-handler.js')).default;
const DetectionEngine = (await import('../../public/modules/detection-engine.js')).default;
const ChartManager = (await import('../../public/modules/chart-manager.js')).default;
const DataExporter = (await import('../../public/modules/data-exporter.js')).default;

describe('Video Analytics System Integration', () => {
  let errorHandler;
  let detectionEngine;
  let chartManager;
  let dataExporter;
  let mockVideo;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '<canvas id="testChart"></canvas>';

    // Initialize modules
    errorHandler = new ErrorHandler();
    detectionEngine = new DetectionEngine();
    chartManager = new ChartManager('testChart');
    dataExporter = new DataExporter();

    // Mock video element
    mockVideo = {
      videoWidth: 640,
      videoHeight: 480,
      paused: false,
      ended: false
    };

    jest.clearAllMocks();
  });

  describe('Complete Analysis Workflow', () => {
    test('should complete full detection and export cycle', async () => {
      // Step 1: Load detection model
      await detectionEngine.loadModel();
      expect(detectionEngine.isModelReady()).toBe(true);

      // Step 2: Setup chart
      chartManager.setupChart();
      expect(chartManager.chart).not.toBeNull();

      // Step 3: Run detection
      const result = await detectionEngine.detectFrame(mockVideo);
      expect(result.predictions.length).toBeGreaterThan(0);

      // Step 4: Count by category
      const counts = detectionEngine.countByCategory(result.predictions);
      expect(counts.person).toBe(1);

      // Step 5: Add to chart
      chartManager.addDataPoint('10:00:00', counts);
      expect(chartManager.data.timestamps.length).toBe(1);

      // Step 6: Export data
      const data = [
        {
          timestamp: '10:00:00',
          person: counts.person,
          vehicle: counts.vehicle,
          object: counts.object
        }
      ];

      expect(() => {
        dataExporter.exportJSON(data, { videoName: 'test.mp4' });
      }).not.toThrow();
    });

    test('should handle errors gracefully throughout workflow', async () => {
      try {
        // Try to detect without loading model
        await detectionEngine.detectFrame(mockVideo);
      } catch (error) {
        const handled = errorHandler.handle(error, 'Detection');
        expect(handled.message).toContain('Model not loaded');
      }

      // Verify error was logged
      expect(errorHandler.getErrorLog().length).toBe(1);
    });
  });

  describe('Module Communication', () => {
    test('DetectionEngine -> ChartManager data flow', async () => {
      await detectionEngine.loadModel();
      chartManager.setupChart();

      // Simulate multiple detections
      for (let i = 0; i < 5; i++) {
        const result = await detectionEngine.detectFrame(mockVideo);
        const counts = detectionEngine.countByCategory(result.predictions);
        chartManager.addDataPoint(`10:00:0${i}`, counts);
      }

      expect(chartManager.data.timestamps.length).toBe(5);

      const stats = chartManager.getStatistics();
      expect(stats.person.max).toBeGreaterThanOrEqual(0);
    });

    test('ChartManager -> DataExporter data flow', () => {
      chartManager.setupChart();

      // Add test data
      chartManager.addDataPoint('10:00:00', { person: 2, vehicle: 1, object: 3 });
      chartManager.addDataPoint('10:00:01', { person: 3, vehicle: 0, object: 2 });

      // Prepare data for export
      const exportData = chartManager.data.timestamps.map((ts, i) => ({
        timestamp: ts,
        person: chartManager.data.personCount[i],
        vehicle: chartManager.data.vehicleCount[i],
        object: chartManager.data.objectCount[i]
      }));

      // Export
      expect(() => {
        dataExporter.exportCSV(exportData);
      }).not.toThrow();

      const stats = dataExporter.calculateStatistics(exportData);
      expect(stats.person.avg).toBe(2.5);
    });
  });

  describe('Error Handling Across Modules', () => {
    test('should propagate errors through error handler', async () => {
      const invalidVideo = null;

      try {
        await detectionEngine.loadModel();
        await detectionEngine.detectFrame(invalidVideo);
      } catch (error) {
        const handled = errorHandler.handle(error, 'DetectionEngine', true);
        expect(handled.context).toBe('DetectionEngine');
      }

      expect(errorHandler.getErrorLog().length).toBeGreaterThan(0);
    });

    test('should validate data before export', () => {
      const invalidData = null;

      // DataExporter should handle invalid data
      expect(() => {
        try {
          dataExporter.exportJSON(invalidData, {});
        } catch (error) {
          errorHandler.handle(error, 'DataExporter');
        }
      }).not.toThrow();
    });
  });

  describe('Configuration Propagation', () => {
    test('should apply confidence threshold across pipeline', async () => {
      await detectionEngine.loadModel();

      // Set low confidence threshold
      detectionEngine.setConfidenceThreshold(0.3);

      const result1 = await detectionEngine.detectFrame(mockVideo);
      const lowThresholdCount = result1.predictions.length;

      // Set high confidence threshold
      detectionEngine.setConfidenceThreshold(0.9);

      const result2 = await detectionEngine.detectFrame(mockVideo);
      const highThresholdCount = result2.predictions.length;

      // High threshold should filter more
      expect(highThresholdCount).toBeLessThanOrEqual(lowThresholdCount);
    });

    test('should filter by enabled classes', async () => {
      await detectionEngine.loadModel();

      // Enable only persons
      detectionEngine.setEnabledClasses(['person']);

      const result = await detectionEngine.detectFrame(mockVideo);
      const counts = detectionEngine.countByCategory(result.predictions);

      // Should only have person detections (or none if filtered out)
      expect(counts.vehicle).toBe(0);
      expect(counts.object).toBe(0);
    });
  });

  describe('Data Consistency', () => {
    test('should maintain data consistency across modules', async () => {
      await detectionEngine.loadModel();
      chartManager.setupChart();

      const detectionResults = [];

      // Run 3 detections
      for (let i = 0; i < 3; i++) {
        const result = await detectionEngine.detectFrame(mockVideo);
        const counts = detectionEngine.countByCategory(result.predictions);

        detectionResults.push({
          timestamp: `10:00:0${i}`,
          ...counts
        });

        chartManager.addDataPoint(`10:00:0${i}`, counts);
      }

      // Verify chart has same data
      expect(chartManager.data.timestamps.length).toBe(detectionResults.length);

      // Verify statistics match
      const chartStats = chartManager.getStatistics();
      const exportStats = dataExporter.calculateStatistics(detectionResults);

      expect(chartStats.person.avg).toBeCloseTo(exportStats.person.avg, 1);
      expect(chartStats.person.max).toBe(exportStats.person.max);
    });
  });

  describe('Memory Management', () => {
    test('should respect data limits in ChartManager', async () => {
      const smallChart = new ChartManager('testChart', 5);
      smallChart.setupChart();
      await detectionEngine.loadModel();

      // Add 10 data points
      for (let i = 0; i < 10; i++) {
        const result = await detectionEngine.detectFrame(mockVideo);
        const counts = detectionEngine.countByCategory(result.predictions);
        smallChart.addDataPoint(`10:${i}0:00`, counts);
      }

      // Should only keep 5 most recent
      expect(smallChart.data.timestamps.length).toBe(5);
    });

    test('should respect error log limits', () => {
      const smallHandler = new ErrorHandler(3);

      for (let i = 0; i < 5; i++) {
        smallHandler.handle(new Error(`Error ${i}`), 'Test');
      }

      expect(smallHandler.getErrorLog().length).toBe(3);
    });
  });

  describe('Cleanup', () => {
    test('should properly cleanup resources', () => {
      chartManager.setupChart();

      // Clear data
      chartManager.clearData();
      expect(chartManager.data.timestamps.length).toBe(0);

      // Clear errors
      errorHandler.clearErrorLog();
      expect(errorHandler.getErrorLog().length).toBe(0);

      // Destroy chart
      chartManager.destroy();
      expect(chartManager.chart).toBeNull();
    });
  });
});
