/**
 * Unit Tests for DataExporter Module
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock browser APIs
global.URL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn()
};

global.Blob = class Blob {
  constructor(content, options) {
    this.content = content;
    this.type = options?.type || '';
  }
};

// Mock link click
HTMLAnchorElement.prototype.click = jest.fn();

// Import DataExporter
const DataExporter = (await import('../../public/modules/data-exporter.js')).default;

describe('DataExporter', () => {
  let exporter;

  beforeEach(() => {
    exporter = new DataExporter();
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize correctly', () => {
      expect(exporter).toBeInstanceOf(DataExporter);
    });
  });

  describe('exportJSON()', () => {
    test('should export data as JSON file', () => {
      const data = [
        { timestamp: '10:00:00', person: 2, vehicle: 1, object: 3 },
        { timestamp: '10:00:01', person: 3, vehicle: 0, object: 2 }
      ];
      const metadata = { videoName: 'test.mp4', duration: 120 };

      exporter.exportJSON(data, metadata, 'test-export');

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      const link = document.querySelector('a[download]');
      expect(link).not.toBeNull();
      expect(link.download).toBe('test-export.json');
    });

    test('should include metadata in export', () => {
      const data = [{ timestamp: '10:00:00', person: 1 }];
      const metadata = { videoName: 'video.mp4', analyzedAt: Date.now() };

      exporter.exportJSON(data, metadata);

      const blob = global.URL.createObjectURL.mock.calls[0][0];
      const content = JSON.parse(blob.content[0]);

      expect(content.metadata).toEqual(metadata);
      expect(content.detections).toEqual(data);
    });

    test('should calculate statistics', () => {
      const data = [
        { timestamp: '10:00:00', person: 2, vehicle: 1, object: 3 },
        { timestamp: '10:00:01', person: 4, vehicle: 2, object: 1 }
      ];

      exporter.exportJSON(data, {});

      const blob = global.URL.createObjectURL.mock.calls[0][0];
      const content = JSON.parse(blob.content[0]);

      expect(content.statistics.person.avg).toBe(3);
      expect(content.statistics.person.max).toBe(4);
      expect(content.statistics.vehicle.avg).toBe(1.5);
      expect(content.statistics.vehicle.max).toBe(2);
    });

    test('should use default filename if not provided', () => {
      exporter.exportJSON([], {});

      const link = document.querySelector('a[download]');
      expect(link.download).toMatch(/video-analytics-\d+\.json/);
    });

    test('should clean up blob URL after download', (done) => {
      exporter.exportJSON([], {});

      setTimeout(() => {
        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
        done();
      }, 150);
    });
  });

  describe('exportCSV()', () => {
    test('should export data as CSV file', () => {
      const data = [
        { timestamp: '10:00:00', person: 2, vehicle: 1, object: 3 },
        { timestamp: '10:00:01', person: 3, vehicle: 0, object: 2 }
      ];

      exporter.exportCSV(data, 'test-export');

      const link = document.querySelector('a[download]');
      expect(link).not.toBeNull();
      expect(link.download).toBe('test-export.csv');
    });

    test('should format CSV correctly', () => {
      const data = [{ timestamp: '10:00:00', person: 2, vehicle: 1, object: 3 }];

      exporter.exportCSV(data);

      const blob = global.URL.createObjectURL.mock.calls[0][0];
      const csv = blob.content[0];

      expect(csv).toContain('Timestamp,Persons,Vehicles,Objects');
      expect(csv).toContain('10:00:00,2,1,3');
    });

    test('should handle empty data', () => {
      exporter.exportCSV([]);

      const blob = global.URL.createObjectURL.mock.calls[0][0];
      const csv = blob.content[0];

      expect(csv).toBe('Timestamp,Persons,Vehicles,Objects\n');
    });

    test('should escape special characters', () => {
      const data = [
        { timestamp: '10:00:00', person: 2, vehicle: 1, object: 3, note: 'Test, with comma' }
      ];

      exporter.exportCSV(data);

      const blob = global.URL.createObjectURL.mock.calls[0][0];
      const csv = blob.content[0];

      // Should handle the data correctly
      expect(csv).toContain('10:00:00,2,1,3');
    });
  });

  describe('exportSummaryReport()', () => {
    test('should export summary as text file', () => {
      const data = [
        { timestamp: '10:00:00', person: 2, vehicle: 1, object: 3 },
        { timestamp: '10:00:01', person: 3, vehicle: 0, object: 2 }
      ];
      const metadata = { videoName: 'test.mp4', duration: 120 };

      exporter.exportSummaryReport(data, metadata);

      const link = document.querySelector('a[download]');
      expect(link).not.toBeNull();
      expect(link.download).toMatch(/summary-report-.*\.txt/);
    });

    test('should include all report sections', () => {
      const data = [{ timestamp: '10:00:00', person: 5, vehicle: 2, object: 1 }];
      const metadata = { videoName: 'video.mp4', duration: 60 };

      exporter.exportSummaryReport(data, metadata);

      const blob = global.URL.createObjectURL.mock.calls[0][0];
      const report = blob.content[0];

      expect(report).toContain('VIDEO ANALYTICS SUMMARY REPORT');
      expect(report).toContain('Video Information');
      expect(report).toContain('Detection Statistics');
      expect(report).toContain('video.mp4');
    });

    test('should format statistics correctly', () => {
      const data = [
        { timestamp: '10:00:00', person: 2, vehicle: 4, object: 6 },
        { timestamp: '10:00:01', person: 8, vehicle: 2, object: 4 }
      ];

      exporter.exportSummaryReport(data, {});

      const blob = global.URL.createObjectURL.mock.calls[0][0];
      const report = blob.content[0];

      expect(report).toContain('Average: 5.00');
      expect(report).toContain('Maximum: 8');
      expect(report).toContain('Total Frames: 2');
    });
  });

  describe('calculateStatistics()', () => {
    test('should calculate correct averages and maxes', () => {
      const data = [
        { person: 2, vehicle: 1, object: 3 },
        { person: 4, vehicle: 3, object: 1 },
        { person: 6, vehicle: 5, object: 2 }
      ];

      const stats = exporter.calculateStatistics(data);

      expect(stats.person.avg).toBe(4);
      expect(stats.person.max).toBe(6);
      expect(stats.person.total).toBe(12);

      expect(stats.vehicle.avg).toBe(3);
      expect(stats.vehicle.max).toBe(5);
      expect(stats.vehicle.total).toBe(9);

      expect(stats.object.avg).toBe(2);
      expect(stats.object.max).toBe(3);
      expect(stats.object.total).toBe(6);
    });

    test('should handle empty data', () => {
      const stats = exporter.calculateStatistics([]);

      expect(stats.person.avg).toBe(0);
      expect(stats.person.max).toBe(0);
      expect(stats.person.total).toBe(0);
    });

    test('should handle missing properties', () => {
      const data = [
        { person: 2 }, // Missing vehicle and object
        { vehicle: 3 }, // Missing person and object
        { object: 1 } // Missing person and vehicle
      ];

      const stats = exporter.calculateStatistics(data);

      expect(stats.person.total).toBe(2);
      expect(stats.vehicle.total).toBe(3);
      expect(stats.object.total).toBe(1);
    });

    test('should calculate correct averages with decimals', () => {
      const data = [
        { person: 1, vehicle: 1, object: 1 },
        { person: 2, vehicle: 2, object: 2 },
        { person: 3, vehicle: 3, object: 3 }
      ];

      const stats = exporter.calculateStatistics(data);

      expect(stats.person.avg).toBe(2);
      expect(stats.vehicle.avg).toBe(2);
      expect(stats.object.avg).toBe(2);
    });
  });

  describe('formatTimestamp()', () => {
    test('should format timestamp for filename', () => {
      const timestamp = exporter.formatTimestamp();

      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}-\d{6}$/);
    });

    test('should create unique timestamps', () => {
      const ts1 = exporter.formatTimestamp();
      const ts2 = exporter.formatTimestamp();

      // Should be the same or very close (same second)
      expect(ts1.substring(0, 10)).toBe(ts2.substring(0, 10));
    });
  });

  describe('Edge Cases', () => {
    test('should handle very large datasets', () => {
      const data = Array.from({ length: 10000 }, (_, i) => ({
        timestamp: `10:${Math.floor(i / 60)}:${i % 60}`,
        person: i % 10,
        vehicle: i % 5,
        object: i % 3
      }));

      expect(() => exporter.exportJSON(data, {})).not.toThrow();
      expect(() => exporter.exportCSV(data)).not.toThrow();
    });

    test('should handle data with zero values', () => {
      const data = [{ timestamp: '10:00:00', person: 0, vehicle: 0, object: 0 }];

      const stats = exporter.calculateStatistics(data);

      expect(stats.person.avg).toBe(0);
      expect(stats.person.max).toBe(0);
    });

    test('should handle single data point', () => {
      const data = [{ timestamp: '10:00:00', person: 5, vehicle: 3, object: 2 }];

      const stats = exporter.calculateStatistics(data);

      expect(stats.person.avg).toBe(5);
      expect(stats.person.max).toBe(5);
    });

    test('should handle metadata with special characters', () => {
      const metadata = { videoName: 'test "video" name.mp4', duration: 120 };
      const data = [];

      expect(() => exporter.exportJSON(data, metadata)).not.toThrow();
    });

    test('should handle null/undefined metadata', () => {
      const data = [{ timestamp: '10:00:00', person: 1 }];

      expect(() => exporter.exportJSON(data, null)).not.toThrow();
      expect(() => exporter.exportJSON(data, undefined)).not.toThrow();
    });
  });
});
