/**
 * Detection Engine Module
 * Handles AI model loading, object detection, and prediction filtering
 * @module DetectionEngine
 */

class DetectionEngine {
  /**
   * Create a detection engine
   * @param {Object} config - Detection configuration
   */
  constructor(config = {}) {
    this.model = null;
    this.config = {
      detectPeople: true,
      detectVehicles: true,
      detectAnimals: false,
      detectSports: false,
      detectFurniture: false,
      detectPaymentSystems: false,
      detectObjects: true,
      confidenceThreshold: 0.5,
      detectionFPS: 5,
      ...config
    };

    // Object class definitions
    this.vehicleClasses = ['car', 'truck', 'bus', 'motorcycle', 'bicycle'];
    this.personClass = ['person'];
    this.animalClasses = [
      'bird',
      'cat',
      'dog',
      'horse',
      'sheep',
      'cow',
      'elephant',
      'bear',
      'zebra',
      'giraffe'
    ];
    this.sportsClasses = [
      'sports ball',
      'baseball bat',
      'baseball glove',
      'skateboard',
      'surfboard',
      'tennis racket',
      'frisbee',
      'skis',
      'snowboard',
      'kite'
    ];
    this.furnitureClasses = [
      'chair',
      'couch',
      'bed',
      'dining table',
      'toilet',
      'tv',
      'laptop',
      'mouse',
      'keyboard',
      'cell phone'
    ];
    this.paymentSystemClasses = [
      'laptop',
      'keyboard',
      'mouse',
      'cell phone',
      'tv',
      'book',
      'bottle',
      'cup'
    ];

    this.isModelLoaded = false;
    this.detectionInProgress = false;
  }

  /**
   * Load the COCO-SSD model
   * @async
   * @returns {Promise<boolean>} True if model loaded successfully
   * @throws {Error} If model fails to load
   */
  async loadModel() {
    try {
      console.log('Loading COCO-SSD model...');
      this.model = await cocoSsd.load();
      this.isModelLoaded = true;
      console.log('COCO-SSD model loaded successfully');
      return true;
    } catch (error) {
      this.isModelLoaded = false;
      throw new Error(`Failed to load AI model: ${error.message}`);
    }
  }

  /**
   * Detect objects in a video frame
   * @async
   * @param {HTMLVideoElement} videoElement - Video element to analyze
   * @returns {Promise<Array>} Array of filtered predictions
   * @throws {Error} If detection fails or model not loaded
   */
  async detectFrame(videoElement) {
    if (!this.isModelLoaded || !this.model) {
      throw new Error('AI model not loaded. Please wait for model to load.');
    }

    if (!videoElement) {
      throw new Error('Video element is required for detection');
    }

    if (this.detectionInProgress) {
      console.warn('Detection already in progress, skipping frame');
      return [];
    }

    try {
      this.detectionInProgress = true;
      const startTime = performance.now();

      // Run detection
      const predictions = await this.model.detect(videoElement);

      const endTime = performance.now();
      const detectionTime = endTime - startTime;
      const fps = Math.round(1000 / detectionTime);

      // Filter predictions based on configuration
      const filtered = this.filterPredictions(predictions);

      this.detectionInProgress = false;

      return {
        predictions: filtered,
        fps: fps,
        detectionTime: detectionTime
      };
    } catch (error) {
      this.detectionInProgress = false;
      throw new Error(`Detection failed: ${error.message}`);
    }
  }

  /**
   * Filter predictions based on configuration settings
   * @param {Array} predictions - Raw predictions from model
   * @returns {Array} Filtered predictions
   */
  filterPredictions(predictions) {
    if (!predictions || !Array.isArray(predictions)) {
      return [];
    }

    return predictions.filter((pred) => {
      // Check confidence threshold
      if (pred.score < this.config.confidenceThreshold) {
        return false;
      }

      // Classify prediction type
      const isPerson = this.personClass.includes(pred.class);
      const isVehicle = this.vehicleClasses.includes(pred.class);
      const isAnimal = this.animalClasses.includes(pred.class);
      const isSports = this.sportsClasses.includes(pred.class);
      const isFurniture = this.furnitureClasses.includes(pred.class);
      const isPaymentSystem = this.paymentSystemClasses.includes(pred.class);

      // Apply type filters
      if (isPerson && !this.config.detectPeople) {
        return false;
      }
      if (isVehicle && !this.config.detectVehicles) {
        return false;
      }
      if (isAnimal && !this.config.detectAnimals) {
        return false;
      }
      if (isSports && !this.config.detectSports) {
        return false;
      }
      if (isFurniture && !this.config.detectFurniture) {
        return false;
      }
      if (isPaymentSystem && !this.config.detectPaymentSystems) {
        return false;
      }
      if (
        !isPerson &&
        !isVehicle &&
        !isAnimal &&
        !isSports &&
        !isFurniture &&
        !isPaymentSystem &&
        !this.config.detectObjects
      ) {
        return false;
      }

      return true;
    });
  }

  /**
   * Classify a prediction by its class
   * @param {Object} prediction - Prediction object
   * @returns {string} Category: 'person', 'vehicle', 'animal', 'sports', 'furniture', 'paymentSystem', or 'object'
   */
  classifyPrediction(prediction) {
    if (this.personClass.includes(prediction.class)) {
      return 'person';
    } else if (this.vehicleClasses.includes(prediction.class)) {
      return 'vehicle';
    } else if (this.animalClasses.includes(prediction.class)) {
      return 'animal';
    } else if (this.sportsClasses.includes(prediction.class)) {
      return 'sports';
    } else if (
      this.config.detectPaymentSystems &&
      this.paymentSystemClasses.includes(prediction.class)
    ) {
      return 'paymentSystem';
    } else if (this.furnitureClasses.includes(prediction.class)) {
      return 'furniture';
    } else if (this.paymentSystemClasses.includes(prediction.class)) {
      return 'paymentSystem';
    }
    return 'object';
  }

  /**
   * Count detections by category
   * @param {Array} predictions - Array of predictions
   * @returns {Object} Counts by category
   */
  countByCategory(predictions) {
    const counts = {
      people: 0,
      vehicles: 0,
      animals: 0,
      sports: 0,
      furniture: 0,
      paymentSystems: 0,
      objects: 0,
      total: 0
    };

    if (!predictions || !Array.isArray(predictions)) {
      return counts;
    }

    predictions.forEach((pred) => {
      const category = this.classifyPrediction(pred);
      counts.total++;

      switch (category) {
        case 'person':
          counts.people++;
          break;
        case 'vehicle':
          counts.vehicles++;
          break;
        case 'animal':
          counts.animals++;
          break;
        case 'sports':
          counts.sports++;
          break;
        case 'furniture':
          counts.furniture++;
          break;
        case 'paymentSystem':
          counts.paymentSystems++;
          break;
        case 'object':
          counts.objects++;
          break;
      }
    });

    return counts;
  }

  /**
   * Update detection configuration
   * @param {Object} newConfig - New configuration values
   */
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }

  /**
   * Get current configuration
   * @returns {Object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Check if model is ready for detection
   * @returns {boolean} True if model is loaded and ready
   */
  isReady() {
    return this.isModelLoaded && this.model !== null;
  }

  /**
   * Get model information
   * @returns {Object} Model information
   */
  getModelInfo() {
    return {
      loaded: this.isModelLoaded,
      modelType: 'COCO-SSD',
      supportedClasses: 80,
      vehicleClasses: this.vehicleClasses,
      personClass: this.personClass
    };
  }

  /**
   * Dispose of the model and free memory
   */
  dispose() {
    if (this.model) {
      // TensorFlow.js models don't have a dispose method, but we can clear the reference
      this.model = null;
      this.isModelLoaded = false;
      console.log('Detection engine disposed');
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DetectionEngine;
}
