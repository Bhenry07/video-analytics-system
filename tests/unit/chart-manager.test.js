/**
 * Unit Tests for ChartManager Module
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock Chart.js
class MockChart {
  constructor(ctx, config) {
    this.ctx = ctx;
    this.config = config;
    this.data = config.data;
    this.options = config.options;
  }

  update() {}
  destroy() {}
}

global.Chart = MockChart;

// Mock canvas
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  canvas: { width: 800, height: 400 },
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn()
}));

// Import ChartManager
const ChartManager = (await import('../../public/modules/chart-manager.js')).default;

describe('ChartManager', () => {
  let chartManager;

  beforeEach(() => {
    document.body.innerHTML = '<canvas id="detectionChart"></canvas>';
    chartManager = new ChartManager('detectionChart');
  });

  describe('Constructor', () => {
    test('should initialize with correct properties', () => {
      expect(chartManager.canvasId).toBe('detectionChart');
      expect(chartManager.chart).toBeNull();
      expect(chartManager.data).toEqual({
        timestamps: [],
        personCount: [],
        vehicleCount: [],
        objectCount: []
      });
      expect(chartManager.maxDataPoints).toBe(50);
    });

    test('should accept custom maxDataPoints', () => {
      const manager = new ChartManager('chart', 100);
      expect(manager.maxDataPoints).toBe(100);
    });
  });

  describe('setupChart()', () => {
    test('should create chart instance', () => {
      chartManager.setupChart();

      expect(chartManager.chart).not.toBeNull();
      expect(chartManager.chart).toBeInstanceOf(MockChart);
    });

    test('should throw error if canvas not found', () => {
      const manager = new ChartManager('nonexistent');

      expect(() => manager.setupChart()).toThrow('Canvas element not found');
    });

    test('should configure chart with correct datasets', () => {
      chartManager.setupChart();

      const datasets = chartManager.chart.config.data.datasets;
      expect(datasets.length).toBe(3);
      expect(datasets[0].label).toBe('Persons');
      expect(datasets[1].label).toBe('Vehicles');
      expect(datasets[2].label).toBe('Objects');
    });

    test('should not recreate chart if already exists', () => {
      chartManager.setupChart();
      const firstChart = chartManager.chart;

      chartManager.setupChart();

      expect(chartManager.chart).toBe(firstChart);
    });
  });

  describe('addDataPoint()', () => {
    beforeEach(() => {
      chartManager.setupChart();
    });

    test('should add data point correctly', () => {
      const timestamp = '10:30:45';
      const counts = { person: 2, vehicle: 1, object: 3 };

      chartManager.addDataPoint(timestamp, counts);

      expect(chartManager.data.timestamps).toContain(timestamp);
      expect(chartManager.data.personCount).toContain(2);
      expect(chartManager.data.vehicleCount).toContain(1);
      expect(chartManager.data.objectCount).toContain(3);
    });

    test('should handle missing counts', () => {
      chartManager.addDataPoint('10:00:00', {});

      expect(chartManager.data.personCount).toContain(0);
      expect(chartManager.data.vehicleCount).toContain(0);
      expect(chartManager.data.objectCount).toContain(0);
    });

    test('should respect maxDataPoints limit', () => {
      const manager = new ChartManager('detectionChart', 3);
      manager.setupChart();

      for (let i = 0; i < 5; i++) {
        manager.addDataPoint(`10:${i}0:00`, { person: i, vehicle: i, object: i });
      }

      expect(manager.data.timestamps.length).toBe(3);
      expect(manager.data.timestamps[0]).toBe('10:20:00'); // First two removed
    });

    test('should call updateChart after adding data', () => {
      const updateSpy = jest.spyOn(chartManager, 'updateChart');

      chartManager.addDataPoint('10:00:00', { person: 1 });

      expect(updateSpy).toHaveBeenCalled();
    });
  });

  describe('updateChart()', () => {
    beforeEach(() => {
      chartManager.setupChart();
    });

    test('should update chart data', () => {
      chartManager.addDataPoint('10:00:00', { person: 5, vehicle: 2, object: 1 });
      chartManager.updateChart();

      const chartData = chartManager.chart.data;
      expect(chartData.labels.length).toBeGreaterThan(0);
      expect(chartData.datasets[0].data.length).toBeGreaterThan(0);
    });

    test('should sample data when exceeding maxDataPoints', () => {
      const manager = new ChartManager('detectionChart', 5);
      manager.setupChart();

      // Add 10 data points
      for (let i = 0; i < 10; i++) {
        manager.data.timestamps.push(`10:${i}0:00`);
        manager.data.personCount.push(i);
        manager.data.vehicleCount.push(i);
        manager.data.objectCount.push(i);
      }

      manager.updateChart();

      const chartLabels = manager.chart.data.labels;
      expect(chartLabels.length).toBeLessThanOrEqual(5);
    });

    test('should handle empty data', () => {
      chartManager.updateChart();

      expect(chartManager.chart.data.labels).toEqual([]);
    });
  });

  describe('sampleData()', () => {
    test('should sample data to maxPoints', () => {
      const data = Array.from({ length: 100 }, (_, i) => i);
      const sampled = chartManager.sampleData(data, 10);

      expect(sampled.length).toBe(10);
      expect(sampled[0]).toBe(0); // First point
      expect(sampled[9]).toBe(99); // Last point
    });

    test('should return original data if under maxPoints', () => {
      const data = [1, 2, 3, 4, 5];
      const sampled = chartManager.sampleData(data, 10);

      expect(sampled).toEqual(data);
    });

    test('should handle empty array', () => {
      const sampled = chartManager.sampleData([], 10);

      expect(sampled).toEqual([]);
    });

    test('should sample evenly across dataset', () => {
      const data = Array.from({ length: 50 }, (_, i) => i);
      const sampled = chartManager.sampleData(data, 5);

      expect(sampled.length).toBe(5);
      expect(sampled).toContain(0);
      expect(sampled).toContain(49);
    });
  });

  describe('getStatistics()', () => {
    beforeEach(() => {
      chartManager.setupChart();
    });

    test('should calculate correct statistics', () => {
      chartManager.addDataPoint('10:00:00', { person: 5, vehicle: 3, object: 2 });
      chartManager.addDataPoint('10:00:01', { person: 3, vehicle: 5, object: 4 });
      chartManager.addDataPoint('10:00:02', { person: 7, vehicle: 1, object: 3 });

      const stats = chartManager.getStatistics();

      expect(stats.person.avg).toBe(5);
      expect(stats.person.max).toBe(7);
      expect(stats.vehicle.avg).toBe(3);
      expect(stats.vehicle.max).toBe(5);
      expect(stats.object.avg).toBe(3);
      expect(stats.object.max).toBe(4);
    });

    test('should return zeros for empty data', () => {
      const stats = chartManager.getStatistics();

      expect(stats.person.avg).toBe(0);
      expect(stats.person.max).toBe(0);
      expect(stats.vehicle.avg).toBe(0);
      expect(stats.vehicle.max).toBe(0);
      expect(stats.object.avg).toBe(0);
      expect(stats.object.max).toBe(0);
    });

    test('should handle single data point', () => {
      chartManager.addDataPoint('10:00:00', { person: 5, vehicle: 3, object: 2 });

      const stats = chartManager.getStatistics();

      expect(stats.person.avg).toBe(5);
      expect(stats.person.max).toBe(5);
    });
  });

  describe('clearData()', () => {
    beforeEach(() => {
      chartManager.setupChart();
      chartManager.addDataPoint('10:00:00', { person: 5, vehicle: 3, object: 2 });
    });

    test('should clear all data arrays', () => {
      chartManager.clearData();

      expect(chartManager.data.timestamps).toEqual([]);
      expect(chartManager.data.personCount).toEqual([]);
      expect(chartManager.data.vehicleCount).toEqual([]);
      expect(chartManager.data.objectCount).toEqual([]);
    });

    test('should update chart after clearing', () => {
      const updateSpy = jest.spyOn(chartManager, 'updateChart');

      chartManager.clearData();

      expect(updateSpy).toHaveBeenCalled();
    });
  });

  describe('destroy()', () => {
    test('should destroy chart instance', () => {
      chartManager.setupChart();
      const destroySpy = jest.spyOn(chartManager.chart, 'destroy');

      chartManager.destroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(chartManager.chart).toBeNull();
    });

    test('should not throw if chart not created', () => {
      expect(() => chartManager.destroy()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle negative counts', () => {
      chartManager.setupChart();
      chartManager.addDataPoint('10:00:00', { person: -5, vehicle: -3, object: -2 });

      // Should store as-is (validation should happen elsewhere)
      expect(chartManager.data.personCount).toContain(-5);
    });

    test('should handle very large numbers', () => {
      chartManager.setupChart();
      chartManager.addDataPoint('10:00:00', { person: 1000000, vehicle: 999999, object: 888888 });

      const stats = chartManager.getStatistics();
      expect(stats.person.max).toBe(1000000);
    });

    test('should handle decimal values', () => {
      chartManager.setupChart();
      chartManager.addDataPoint('10:00:00', { person: 5.7, vehicle: 3.2, object: 2.9 });

      const stats = chartManager.getStatistics();
      expect(stats.person.avg).toBeCloseTo(5.7, 1);
    });
  });
});
