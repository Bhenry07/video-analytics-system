/**
 * Auto-Labeling Engine
 *
 * Automatically labels extracted frames using COCO-SSD detections
 * with custom mapping rules for domain-specific classes.
 *
 * Features:
 * - Pre-label frames using existing detections
 * - Custom class mapping rules
 * - Spatial relationship detection (e.g., person near ATM)
 * - Confidence-based filtering
 * - Batch processing
 * - Export to multiple formats (Roboflow, YOLO, COCO)
 */

class AutoLabelingEngine {
  constructor(detectionEngine) {
    this.detectionEngine = detectionEngine;
    this.annotations = new Map(); // frameId -> annotations array
    this.customClasses = [];
    this.mappingRules = [];

    // Default configuration
    this.config = {
      autoDetectEnabled: true,
      minConfidence: 0.5,
      enableSpatialRules: true,
      autoSave: true
    };

    // Statistics
    this.stats = {
      totalFrames: 0,
      labeledFrames: 0,
      totalAnnotations: 0,
      autoLabeled: 0,
      manualLabeled: 0
    };
  }

  /**
   * Define custom classes for your domain
   */
  defineCustomClasses(classes) {
    this.customClasses = classes.map((cls, index) => ({
      id: index,
      name: cls.name,
      color: cls.color || this.generateColor(index),
      description: cls.description || '',
      icon: cls.icon || '📦'
    }));

    console.log('[Auto-Labeling] Custom classes defined:', this.customClasses);
  }

  /**
   * Add mapping rules for auto-labeling
   *
   * Example rules:
   * {
   *   source: 'person',
   *   target: 'customer-at-atm',
   *   condition: 'near',
   *   reference: 'atm-machine',
   *   distance: 50  // pixels
   * }
   */
  addMappingRule(rule) {
    this.mappingRules.push({
      id: this.mappingRules.length,
      source: rule.source, // Original COCO class
      target: rule.target, // Your custom class
      condition: rule.condition, // 'near', 'inside', 'touching', 'always'
      reference: rule.reference, // Reference object (for spatial rules)
      distance: rule.distance || 50, // Distance threshold in pixels
      minConfidence: rule.minConfidence || this.config.minConfidence,
      enabled: true
    });

    console.log('[Auto-Labeling] Mapping rule added:', rule);
  }

  /**
   * Auto-label a single frame using detection results
   */
  async autoLabelFrame(frameId, frame, detectionResults) {
    if (!this.config.autoDetectEnabled) {
      return { success: false, reason: 'Auto-detection disabled' };
    }

    const annotations = [];

    // Process each detection
    for (const detection of detectionResults) {
      // Apply mapping rules
      const mapped = this.applyMappingRules(detection, detectionResults);

      if (mapped) {
        annotations.push({
          id: this.generateAnnotationId(),
          frameId: frameId,
          class: mapped.class,
          bbox: detection.bbox,
          confidence: detection.score,
          source: 'auto',
          timestamp: new Date().toISOString(),
          originalClass: detection.class
        });
      }
    }

    // Store annotations
    this.annotations.set(frameId, annotations);

    // Update stats
    this.stats.totalFrames++;
    if (annotations.length > 0) {
      this.stats.labeledFrames++;
      this.stats.totalAnnotations += annotations.length;
      this.stats.autoLabeled += annotations.length;
    }

    console.log(`[Auto-Labeling] Frame ${frameId}: ${annotations.length} annotations`);

    return {
      success: true,
      frameId,
      annotations,
      count: annotations.length
    };
  }

  /**
   * Batch auto-label multiple frames
   */
  async batchAutoLabel(frames, progressCallback) {
    const results = [];
    let processed = 0;

    for (const frame of frames) {
      // Run detection on frame
      const detections = await this.detectFrame(frame);

      // Use frame.index as the ID
      const frameId = `frame_${String(frame.index).padStart(4, '0')}`;
      
      // Auto-label based on detections
      const result = await this.autoLabelFrame(frameId, frame, detections);
      results.push(result);

      processed++;
      if (progressCallback) {
        progressCallback(processed, frames.length, result);
      }
    }

    return {
      success: true,
      total: frames.length,
      labeled: results.filter((r) => r.success && r.count > 0).length,
      results
    };
  }

  /**
   * Apply mapping rules to a detection
   */
  applyMappingRules(detection, allDetections) {
    // Check each mapping rule
    for (const rule of this.mappingRules) {
      if (!rule.enabled) {
        continue;
      }

      // Check if source class matches
      if (detection.class !== rule.source) {
        continue;
      }

      // Check confidence
      if (detection.score < rule.minConfidence) {
        continue;
      }

      // Apply condition
      const conditionMet = this.checkCondition(
        rule.condition,
        detection,
        allDetections,
        rule.reference,
        rule.distance
      );

      if (conditionMet) {
        return {
          class: rule.target,
          confidence: detection.score,
          rule: rule.id
        };
      }
    }

    // No rule matched - use original class if it's in custom classes
    const customClass = this.customClasses.find((c) => c.name === detection.class);
    if (customClass) {
      return {
        class: detection.class,
        confidence: detection.score,
        rule: null
      };
    }

    return null;
  }

  /**
   * Check spatial condition
   */
  checkCondition(condition, detection, allDetections, reference, distance) {
    switch (condition) {
      case 'always':
        return true;

      case 'near':
        return this.isNear(detection, allDetections, reference, distance);

      case 'inside':
        return this.isInside(detection, allDetections, reference);

      case 'touching':
        return this.isTouching(detection, allDetections, reference);

      default:
        console.warn(`[Auto-Labeling] Unknown condition: ${condition}`);
        return false;
    }
  }

  /**
   * Check if detection is near reference object
   */
  isNear(detection, allDetections, referenceClass, maxDistance) {
    const referenceObj = allDetections.find((d) => d.class === referenceClass);
    if (!referenceObj) {
      return false;
    }

    const dist = this.calculateDistance(detection.bbox, referenceObj.bbox);
    return dist <= maxDistance;
  }

  /**
   * Check if detection is inside reference object
   */
  isInside(detection, allDetections, referenceClass) {
    const referenceObj = allDetections.find((d) => d.class === referenceClass);
    if (!referenceObj) {
      return false;
    }

    const [x1, y1, w1, h1] = detection.bbox;
    const [x2, y2, w2, h2] = referenceObj.bbox;

    return x1 >= x2 && y1 >= y2 && x1 + w1 <= x2 + w2 && y1 + h1 <= y2 + h2;
  }

  /**
   * Check if detection is touching reference object
   */
  isTouching(detection, allDetections, referenceClass) {
    const referenceObj = allDetections.find((d) => d.class === referenceClass);
    if (!referenceObj) {
      return false;
    }

    return this.calculateDistance(detection.bbox, referenceObj.bbox) <= 5;
  }

  /**
   * Calculate distance between two bounding boxes (center to center)
   */
  calculateDistance(bbox1, bbox2) {
    const [x1, y1, w1, h1] = bbox1;
    const [x2, y2, w2, h2] = bbox2;

    const center1X = x1 + w1 / 2;
    const center1Y = y1 + h1 / 2;
    const center2X = x2 + w2 / 2;
    const center2Y = y2 + h2 / 2;

    return Math.sqrt(Math.pow(center2X - center1X, 2) + Math.pow(center2Y - center1Y, 2));
  }

  /**
   * Detect objects in a frame
   */
  async detectFrame(frame) {
    // Use existing detection engine's model directly
    if (this.detectionEngine && this.detectionEngine.model) {
      // Convert dataUrl to image element for detection
      const img = new Image();
      img.src = frame.dataUrl;
      
      // Wait for image to load
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      // Run detection using COCO-SSD model directly
      const predictions = await this.detectionEngine.model.detect(img);
      
      // Convert to our format with bbox array [x, y, width, height]
      const formatted = predictions.map((pred) => ({
        class: pred.class,
        score: pred.score,
        bbox: [pred.bbox[0], pred.bbox[1], pred.bbox[2], pred.bbox[3]]
      }));
      
      return formatted;
    }

    return [];
  }

  /**
   * Manually add/edit annotation
   */
  addAnnotation(frameId, annotation) {
    const frameAnnotations = this.annotations.get(frameId) || [];

    const newAnnotation = {
      id: annotation.id || this.generateAnnotationId(),
      frameId,
      class: annotation.class,
      bbox: annotation.bbox,
      confidence: annotation.confidence || 1.0,
      source: 'manual',
      timestamp: new Date().toISOString()
    };

    frameAnnotations.push(newAnnotation);
    this.annotations.set(frameId, frameAnnotations);

    this.stats.totalAnnotations++;
    this.stats.manualLabeled++;

    return newAnnotation;
  }

  /**
   * Update existing annotation
   */
  updateAnnotation(frameId, annotationId, updates) {
    const frameAnnotations = this.annotations.get(frameId);
    if (!frameAnnotations) {
      return { success: false, error: 'Frame not found' };
    }

    const index = frameAnnotations.findIndex((a) => a.id === annotationId);
    if (index === -1) {
      return { success: false, error: 'Annotation not found' };
    }

    frameAnnotations[index] = {
      ...frameAnnotations[index],
      ...updates,
      timestamp: new Date().toISOString()
    };

    return { success: true, annotation: frameAnnotations[index] };
  }

  /**
   * Delete annotation
   */
  deleteAnnotation(frameId, annotationId) {
    const frameAnnotations = this.annotations.get(frameId);
    if (!frameAnnotations) {
      return { success: false, error: 'Frame not found' };
    }

    const newAnnotations = frameAnnotations.filter((a) => a.id !== annotationId);
    this.annotations.set(frameId, newAnnotations);

    this.stats.totalAnnotations--;

    return { success: true };
  }

  /**
   * Get annotations for a frame
   */
  getAnnotations(frameId) {
    return this.annotations.get(frameId) || [];
  }

  /**
   * Get all annotations
   */
  getAllAnnotations() {
    const all = [];
    for (const [frameId, annotations] of this.annotations.entries()) {
      all.push(...annotations);
    }
    return all;
  }

  /**
   * Export annotations to Roboflow format
   */
  exportToRoboflow() {
    const dataset = {
      info: {
        description: 'Auto-labeled dataset',
        version: '1.0',
        year: new Date().getFullYear(),
        contributor: 'Video Analytics System',
        date_created: new Date().toISOString()
      },
      images: [],
      annotations: [],
      categories: this.customClasses.map((cls) => ({
        id: cls.id,
        name: cls.name,
        supercategory: 'object'
      }))
    };

    let annotationId = 1;

    for (const [frameId, annotations] of this.annotations.entries()) {
      const imageId = parseInt(frameId) || dataset.images.length + 1;

      dataset.images.push({
        id: imageId,
        file_name: `frame_${String(frameId).padStart(4, '0')}.jpg`,
        width: 1920, // TODO: Get from actual frame
        height: 1080
      });

      for (const ann of annotations) {
        const categoryId = this.customClasses.findIndex((c) => c.name === ann.class);

        dataset.annotations.push({
          id: annotationId++,
          image_id: imageId,
          category_id: categoryId,
          bbox: ann.bbox,
          area: ann.bbox[2] * ann.bbox[3],
          segmentation: [],
          iscrowd: 0
        });
      }
    }

    return dataset;
  }

  /**
   * Export to YOLO format
   */
  exportToYOLO() {
    const yoloData = [];

    for (const [frameId, annotations] of this.annotations.entries()) {
      const labels = annotations.map((ann) => {
        const classId = this.customClasses.findIndex((c) => c.name === ann.class);
        const [x, y, w, h] = ann.bbox;

        // Convert to YOLO format (normalized center coordinates)
        const centerX = (x + w / 2) / 1920; // TODO: Use actual image width
        const centerY = (y + h / 2) / 1080; // TODO: Use actual image height
        const width = w / 1920;
        const height = h / 1080;

        return `${classId} ${centerX} ${centerY} ${width} ${height}`;
      });

      yoloData.push({
        frameId,
        filename: `frame_${String(frameId).padStart(4, '0')}.txt`,
        content: labels.join('\n')
      });
    }

    return yoloData;
  }

  /**
   * Generate statistics
   */
  getStats() {
    const classDistribution = {};

    for (const annotations of this.annotations.values()) {
      for (const ann of annotations) {
        classDistribution[ann.class] = (classDistribution[ann.class] || 0) + 1;
      }
    }

    return {
      ...this.stats,
      classDistribution,
      avgAnnotationsPerFrame:
        this.stats.labeledFrames > 0
          ? (this.stats.totalAnnotations / this.stats.labeledFrames).toFixed(2)
          : 0,
      labelingProgress:
        this.stats.totalFrames > 0
          ? ((this.stats.labeledFrames / this.stats.totalFrames) * 100).toFixed(1)
          : 0
    };
  }

  /**
   * Clear all annotations
   */
  clear() {
    this.annotations.clear();
    this.stats = {
      totalFrames: 0,
      labeledFrames: 0,
      totalAnnotations: 0,
      autoLabeled: 0,
      manualLabeled: 0
    };
  }

  /**
   * Utility: Generate annotation ID
   */
  generateAnnotationId() {
    return `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utility: Generate color for class
   */
  generateColor(index) {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#FFA07A',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E2',
      '#F8B4B4',
      '#A3E4D7'
    ];
    return colors[index % colors.length];
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('[Auto-Labeling] Config updated:', this.config);
  }
}

// Export for use in app
window.AutoLabelingEngine = AutoLabelingEngine;
