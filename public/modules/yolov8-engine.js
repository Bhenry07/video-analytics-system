/**
 * YOLOv8 Detection Engine
 * Integrates custom trained YOLOv8 model for banking/ATM detection
 * Uses ONNX Runtime for browser-based inference
 */

/* global ort */

class YOLOv8Engine {
  constructor() {
    this.session = null;
    this.modelLoaded = false;
    this.inputShape = [1, 3, 640, 640]; // [batch, channels, height, width]
    this.classes = [
      'person',
      'car', 
      'truck',
      'handbag',
      'backpack',
      'bottle',
      'cell phone'
    ];
    this.confidenceThreshold = 0.5;
    this.iouThreshold = 0.45;
  }

  /**
   * Load YOLOv8 ONNX model
   */
  async loadModel(modelPath = '/models/banking_model.onnx') {
    try {
      console.log('[YOLOv8] Loading model from:', modelPath);

      if (typeof ort === 'undefined') {
        throw new Error('ONNX Runtime not loaded. Please include onnxruntime-web script.');
      }

      // Configure ONNX Runtime for single-threaded execution
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.simd = true;
      ort.env.wasm.proxy = false;

      console.log('[YOLOv8] Fetching model file...');
      
      // Fetch the model file first to check if it's accessible
      const response = await fetch(modelPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch model: ${response.status} ${response.statusText}`);
      }
      
      const modelBuffer = await response.arrayBuffer();
      console.log(`[YOLOv8] Model file loaded: ${modelBuffer.byteLength} bytes`);

      // Create inference session with single-threaded WASM
      console.log('[YOLOv8] Creating inference session...');
      this.session = await ort.InferenceSession.create(modelBuffer, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'basic',
        enableCpuMemArena: true,
        enableMemPattern: true,
        executionMode: 'sequential'
      });

      this.modelLoaded = true;
      console.log('[YOLOv8] Model loaded successfully!');
      console.log('[YOLOv8] Input names:', this.session.inputNames);
      console.log('[YOLOv8] Output names:', this.session.outputNames);
      console.log('[YOLOv8] Expected input shape:', this.inputShape);
      console.log('[YOLOv8] Classes:', this.classes);

      return true;
    } catch (error) {
      console.error('[YOLOv8] Failed to load model:', error);
      console.error('[YOLOv8] Error details:', error.message || error);
      this.modelLoaded = false;
      return false;
    }
  }

  /**
   * Preprocess image for YOLOv8 inference
   */
  preprocessImage(imageElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Resize to model input size
    canvas.width = this.inputShape[3];
    canvas.height = this.inputShape[2];

    // Draw and resize image
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Convert to float32 tensor [1, 3, 640, 640]
    // Normalize to [0, 1] and convert RGB to tensor format
    const tensorSize = this.inputShape[1] * this.inputShape[2] * this.inputShape[3];
    const tensorData = new Float32Array(tensorSize);

    for (let i = 0; i < canvas.height; i++) {
      for (let j = 0; j < canvas.width; j++) {
        const pixelIndex = (i * canvas.width + j) * 4;
        const tensorIndex = i * canvas.width + j;

        // R, G, B channels (normalize to 0-1)
        tensorData[tensorIndex] = pixels[pixelIndex] / 255.0; // R
        tensorData[tensorSize / 3 + tensorIndex] = pixels[pixelIndex + 1] / 255.0; // G
        tensorData[(tensorSize / 3) * 2 + tensorIndex] = pixels[pixelIndex + 2] / 255.0; // B
      }
    }

    // Create ONNX tensor
    return new ort.Tensor('float32', tensorData, this.inputShape);
  }

  /**
   * Run inference on preprocessed image
   */
  async runInference(inputTensor) {
    try {
      const feeds = { images: inputTensor };
      const results = await this.session.run(feeds);

      // YOLOv8 output format: [batch, 84, 8400]
      // 84 = 4 (bbox) + 80 (classes) or custom class count
      const output = results[this.session.outputNames[0]];

      return output;
    } catch (error) {
      console.error('[YOLOv8] Inference error:', error);
      return null;
    }
  }

  /**
   * Post-process YOLOv8 output
   */
  postprocess(output, originalWidth, originalHeight) {
    if (!output) return [];

    const data = output.data;
    const dimensions = output.dims;
    
    // Parse output: [batch, features, detections]
    const numDetections = dimensions[2]; // 8400
    const numFeatures = dimensions[1]; // 84 or custom

    const detections = [];

    // Extract detections
    for (let i = 0; i < numDetections; i++) {
      // Get class scores (skip first 4 values which are bbox coords)
      let maxScore = 0;
      let maxClassIndex = 0;

      for (let j = 0; j < this.classes.length; j++) {
        const score = data[i + (4 + j) * numDetections];
        if (score > maxScore) {
          maxScore = score;
          maxClassIndex = j;
        }
      }

      // Filter by confidence threshold
      if (maxScore > this.confidenceThreshold) {
        // Get bounding box (center_x, center_y, width, height)
        const cx = data[i];
        const cy = data[i + numDetections];
        const w = data[i + 2 * numDetections];
        const h = data[i + 3 * numDetections];

        // Convert to x1, y1, x2, y2
        const x1 = (cx - w / 2) / this.inputShape[3] * originalWidth;
        const y1 = (cy - h / 2) / this.inputShape[2] * originalHeight;
        const x2 = (cx + w / 2) / this.inputShape[3] * originalWidth;
        const y2 = (cy + h / 2) / this.inputShape[2] * originalHeight;

        detections.push({
          class: this.classes[maxClassIndex],
          score: maxScore,
          bbox: [
            Math.max(0, x1),
            Math.max(0, y1),
            Math.min(originalWidth, x2 - x1),
            Math.min(originalHeight, y2 - y1)
          ]
        });
      }
    }

    // Apply Non-Maximum Suppression (NMS)
    return this.applyNMS(detections);
  }

  /**
   * Apply Non-Maximum Suppression to remove overlapping boxes
   */
  applyNMS(detections) {
    if (detections.length === 0) return [];

    // Sort by confidence score (descending)
    detections.sort((a, b) => b.score - a.score);

    const keep = [];

    while (detections.length > 0) {
      const current = detections.shift();
      keep.push(current);

      // Remove overlapping boxes
      detections = detections.filter(detection => {
        const iou = this.calculateIoU(current.bbox, detection.bbox);
        return iou < this.iouThreshold;
      });
    }

    return keep;
  }

  /**
   * Calculate Intersection over Union (IoU)
   */
  calculateIoU(box1, box2) {
    const [x1, y1, w1, h1] = box1;
    const [x2, y2, w2, h2] = box2;

    const xA = Math.max(x1, x2);
    const yA = Math.max(y1, y2);
    const xB = Math.min(x1 + w1, x2 + w2);
    const yB = Math.min(y1 + h1, y2 + h2);

    const intersectionArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
    const box1Area = w1 * h1;
    const box2Area = w2 * h2;
    const unionArea = box1Area + box2Area - intersectionArea;

    return intersectionArea / unionArea;
  }

  /**
   * Detect objects in image (main API)
   */
  async detect(imageElement) {
    if (!this.modelLoaded) {
      console.warn('[YOLOv8] Model not loaded. Call loadModel() first.');
      return [];
    }

    try {
      // Preprocess
      const inputTensor = this.preprocessImage(imageElement);

      // Run inference
      const output = await this.runInference(inputTensor);

      // Postprocess
      const detections = this.postprocess(
        output,
        imageElement.width,
        imageElement.height
      );

      console.log(`[YOLOv8] Detected ${detections.length} objects`);
      return detections;
    } catch (error) {
      console.error('[YOLOv8] Detection error:', error);
      return [];
    }
  }

  /**
   * Set confidence threshold
   */
  setConfidenceThreshold(threshold) {
    this.confidenceThreshold = Math.max(0, Math.min(1, threshold));
    console.log(`[YOLOv8] Confidence threshold set to ${this.confidenceThreshold}`);
  }

  /**
   * Set IoU threshold for NMS
   */
  setIoUThreshold(threshold) {
    this.iouThreshold = Math.max(0, Math.min(1, threshold));
    console.log(`[YOLOv8] IoU threshold set to ${this.iouThreshold}`);
  }

  /**
   * Check if model is ready
   */
  isReady() {
    return this.modelLoaded;
  }

  /**
   * Get model info
   */
  getInfo() {
    return {
      loaded: this.modelLoaded,
      inputShape: this.inputShape,
      classes: this.classes,
      confidenceThreshold: this.confidenceThreshold,
      iouThreshold: this.iouThreshold
    };
  }
}

// Export for use in app
window.YOLOv8Engine = YOLOv8Engine;
