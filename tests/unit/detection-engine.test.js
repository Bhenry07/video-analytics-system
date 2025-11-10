/**
 * Unit Tests for DetectionEngine Module
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock TensorFlow.js
const mockModel = {
  detect: jest.fn()
};

global.cocoSsd = {
  load: jest.fn(() => Promise.resolve(mockModel))
};

// Import DetectionEngine
const DetectionEngine = (await import('../../public/modules/detection-engine.js')).default;

describe('DetectionEngine', () => {
  let engine;
  let mockVideoElement;

  beforeEach(() => {
    engine = new DetectionEngine();

    // Mock video element
    mockVideoElement = {
      videoWidth: 640,
      videoHeight: 480,
      paused: false,
      ended: false
    };

    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize with correct default values', () => {
      expect(engine.model).toBeNull();
      expect(engine.isModelLoaded).toBe(false);
      expect(engine.confidenceThreshold).toBe(0.5);
      expect(engine.enabledClasses).toEqual([]);
      expect(engine.lastFrameTime).toBe(0);
    });
  });

  describe('loadModel()', () => {
    test('should load COCO-SSD model successfully', async () => {
      await engine.loadModel();

      expect(global.cocoSsd.load).toHaveBeenCalled();
      expect(engine.model).toBe(mockModel);
      expect(engine.isModelLoaded).toBe(true);
    });

    test('should not reload if already loaded', async () => {
      await engine.loadModel();
      await engine.loadModel();

      expect(global.cocoSsd.load).toHaveBeenCalledTimes(1);
    });

    test('should throw error if cocoSsd not available', async () => {
      const tempCocoSsd = global.cocoSsd;
      global.cocoSsd = undefined;

      await expect(engine.loadModel()).rejects.toThrow('COCO-SSD library not loaded');

      global.cocoSsd = tempCocoSsd;
    });
  });

  describe('detectFrame()', () => {
    beforeEach(async () => {
      await engine.loadModel();
    });

    test('should detect objects in video frame', async () => {
      const mockPredictions = [
        { class: 'person', score: 0.9, bbox: [10, 10, 100, 100] },
        { class: 'car', score: 0.8, bbox: [200, 200, 150, 150] }
      ];

      mockModel.detect.mockResolvedValue(mockPredictions);

      const result = await engine.detectFrame(mockVideoElement);

      expect(result.predictions).toEqual(mockPredictions);
      expect(result.fps).toBeGreaterThan(0);
      expect(mockModel.detect).toHaveBeenCalledWith(mockVideoElement);
    });

    test('should calculate FPS correctly', async () => {
      mockModel.detect.mockResolvedValue([]);

      engine.lastFrameTime = performance.now() - 100; // 100ms ago
      const result = await engine.detectFrame(mockVideoElement);

      expect(result.fps).toBeCloseTo(10, 0); // ~10 FPS
    });

    test('should throw error if model not loaded', async () => {
      const uninitializedEngine = new DetectionEngine();

      await expect(uninitializedEngine.detectFrame(mockVideoElement)).rejects.toThrow(
        'Model not loaded'
      );
    });

    test('should throw error if video element invalid', async () => {
      await expect(engine.detectFrame(null)).rejects.toThrow('Invalid video element');
    });

    test('should apply filters to predictions', async () => {
      const mockPredictions = [
        { class: 'person', score: 0.9, bbox: [10, 10, 100, 100] },
        { class: 'car', score: 0.3, bbox: [200, 200, 150, 150] } // Low confidence
      ];

      mockModel.detect.mockResolvedValue(mockPredictions);
      engine.setConfidenceThreshold(0.5);

      const result = await engine.detectFrame(mockVideoElement);

      expect(result.predictions.length).toBe(1);
      expect(result.predictions[0].class).toBe('person');
    });
  });

  describe('filterPredictions()', () => {
    test('should filter by confidence threshold', () => {
      const predictions = [
        { class: 'person', score: 0.9 },
        { class: 'car', score: 0.3 },
        { class: 'dog', score: 0.6 }
      ];

      engine.setConfidenceThreshold(0.5);
      const filtered = engine.filterPredictions(predictions);

      expect(filtered.length).toBe(2);
      expect(filtered.map((p) => p.class)).toEqual(['person', 'dog']);
    });

    test('should filter by enabled classes', () => {
      const predictions = [
        { class: 'person', score: 0.9 },
        { class: 'car', score: 0.8 },
        { class: 'dog', score: 0.7 }
      ];

      engine.setEnabledClasses(['person', 'car']);
      const filtered = engine.filterPredictions(predictions);

      expect(filtered.length).toBe(2);
      expect(filtered.map((p) => p.class)).toEqual(['person', 'car']);
    });

    test('should apply both filters', () => {
      const predictions = [
        { class: 'person', score: 0.9 },
        { class: 'car', score: 0.3 },
        { class: 'dog', score: 0.7 }
      ];

      engine.setConfidenceThreshold(0.5);
      engine.setEnabledClasses(['person', 'dog']);
      const filtered = engine.filterPredictions(predictions);

      expect(filtered.length).toBe(1);
      expect(filtered[0].class).toBe('person');
    });

    test('should return all when no filters set', () => {
      const predictions = [
        { class: 'person', score: 0.9 },
        { class: 'car', score: 0.3 }
      ];

      const filtered = engine.filterPredictions(predictions);

      expect(filtered.length).toBe(1); // Still applies default 0.5 threshold
    });
  });

  describe('classifyPrediction()', () => {
    test('should classify person correctly', () => {
      const pred = { class: 'person', score: 0.9 };
      expect(engine.classifyPrediction(pred)).toBe('person');
    });

    test('should classify vehicles correctly', () => {
      const vehicles = [
        'car',
        'truck',
        'bus',
        'motorcycle',
        'bicycle',
        'train',
        'airplane',
        'boat'
      ];

      vehicles.forEach((vehicle) => {
        const pred = { class: vehicle, score: 0.9 };
        expect(engine.classifyPrediction(pred)).toBe('vehicle');
      });
    });

    test('should classify other objects', () => {
      const pred = { class: 'chair', score: 0.9 };
      expect(engine.classifyPrediction(pred)).toBe('object');
    });
  });

  describe('countByCategory()', () => {
    test('should count predictions by category', () => {
      const predictions = [
        { class: 'person', score: 0.9 },
        { class: 'person', score: 0.8 },
        { class: 'car', score: 0.9 },
        { class: 'dog', score: 0.7 }
      ];

      const counts = engine.countByCategory(predictions);

      expect(counts).toEqual({
        person: 2,
        vehicle: 1,
        object: 1
      });
    });

    test('should return zero counts for empty predictions', () => {
      const counts = engine.countByCategory([]);

      expect(counts).toEqual({
        person: 0,
        vehicle: 0,
        object: 0
      });
    });
  });

  describe('Configuration Methods', () => {
    test('setConfidenceThreshold should update threshold', () => {
      engine.setConfidenceThreshold(0.7);
      expect(engine.confidenceThreshold).toBe(0.7);
    });

    test('setConfidenceThreshold should clamp to 0-1 range', () => {
      engine.setConfidenceThreshold(-0.5);
      expect(engine.confidenceThreshold).toBe(0);

      engine.setConfidenceThreshold(1.5);
      expect(engine.confidenceThreshold).toBe(1);
    });

    test('setEnabledClasses should update enabled classes', () => {
      engine.setEnabledClasses(['person', 'car']);
      expect(engine.enabledClasses).toEqual(['person', 'car']);
    });

    test('setEnabledClasses should convert to lowercase', () => {
      engine.setEnabledClasses(['Person', 'CAR', 'Dog']);
      expect(engine.enabledClasses).toEqual(['person', 'car', 'dog']);
    });
  });

  describe('isModelReady()', () => {
    test('should return false before loading', () => {
      expect(engine.isModelReady()).toBe(false);
    });

    test('should return true after loading', async () => {
      await engine.loadModel();
      expect(engine.isModelReady()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty predictions array', () => {
      const filtered = engine.filterPredictions([]);
      expect(filtered).toEqual([]);
    });

    test('should handle prediction with missing properties', () => {
      const predictions = [
        { class: 'person' }, // Missing score
        { score: 0.9 } // Missing class
      ];

      const filtered = engine.filterPredictions(predictions);
      expect(filtered.length).toBeLessThanOrEqual(predictions.length);
    });

    test('should handle detectFrame with paused video', async () => {
      await engine.loadModel();
      mockVideoElement.paused = true;
      mockModel.detect.mockResolvedValue([]);

      const result = await engine.detectFrame(mockVideoElement);
      expect(result.predictions).toEqual([]);
    });
  });
});
