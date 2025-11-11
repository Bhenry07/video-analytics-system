/**
 * Video Analytics - Main Application File (Refactored)
 * Integrates all modules: DetectionEngine, ChartManager, UIController, DataExporter, ErrorHandler, ROIManager, HeatMap
 * @author Video Analytics System
 * @version 2.0.0
 */

/* global ProfileManager, ROIManager, HeatMap */

class VideoAnalytics {
  /**
   * Create the Video Analytics application
   */
  constructor() {
    // Core components
    this.player = null;
    this.canvas = null;
    this.ctx = null;

    // Modules
    this.detectionEngine = null;
    this.yolov8Engine = null;
    this.currentModel = 'coco-ssd';
    this.chartManager = null;
    this.uiController = null;
    this.profileManager = null;
    this.roiManager = null;
    this.heatMap = null;
    this.frameExtractor = null;

    // State
    this.isAnalyzing = false;
    this.detectionData = [];
    this.detectionInterval = null;
    this.animationFrameId = null;
    this.currentVideoPath = null;

    // Configuration
    this.config = {
      detectPeople: true,
      detectVehicles: true,
      detectAnimals: false,
      detectSports: false,
      detectFurniture: false,
      detectObjects: true,
      confidenceThreshold: 0.5,
      detectionFPS: 5
    };

    this.init();
  }

  /**
   * Initialize the application
   * @async
   */
  async init() {
    try {
      // Initialize modules
      this.detectionEngine = new DetectionEngine(this.config);
      this.chartManager = new ChartManager('timelineChart');
      this.uiController = new UIController();
      this.profileManager = new ProfileManager();

      // Setup UI
      this.uiController.initialize();
      this.setupUICallbacks();
      this.uiController.setupEventListeners();

      // Populate profile dropdown
      this.updateProfileDropdown();

      // Load AI model
      await this.loadModel();

      // Setup video player and chart
      this.setupVideoPlayer();
      this.chartManager.setupChart();

      // Setup ROI Manager
      this.setupROIManager();

      // Setup Heat Map
      this.setupHeatMap();

      // Setup Frame Extractor
      this.setupFrameExtractor();

      // Setup Auto-Labeling System
      this.setupAutoLabeling();

      // Setup Model Selector
      this.setupModelSelector();

      // Load existing videos
      await this.loadVideos();

      ErrorHandler.showSuccess('Application initialized successfully!');
    } catch (error) {
      ErrorHandler.handle(error, 'Application Initialization');
    }
  }

  /**
   * Setup UI callbacks
   */
  setupUICallbacks() {
    this.uiController.registerCallbacks({
      onUpload: () => this.uploadVideo(),
      onStartAnalysis: () => this.startAnalysis(),
      onStopAnalysis: () => this.stopAnalysis(),
      onExportData: () => this.exportData(),
      onConfigChange: (config) => this.updateConfig(config),
      onVideoSelect: (video) => this.loadVideo(video.path),
      onVideoDelete: (filename) => this.deleteVideo(filename),
      onProfileSelect: (profileId) => this.loadProfile(profileId),
      onSaveProfile: () => this.saveProfile(),
      onLoadProfile: () => this.showLoadProfileDialog(),
      onDeleteProfile: () => this.deleteProfile(),
      // ROI callbacks
      onDrawingModeChange: (enabled) => this.toggleDrawingMode(enabled),
      onShapeTypeChange: (type) => this.changeShapeType(type),
      onCompletePolygon: () => this.completePolygon(),
      onClearZones: () => this.clearAllZones(),
      onExportZones: () => this.exportZones(),
      onImportZones: () => this.importZones(),
      // Heat map callbacks
      onHeatmapToggle: (enabled) => this.toggleHeatmap(enabled),
      onHeatmapIntensityChange: (intensity) => this.updateHeatmapIntensity(intensity),
      onHeatmapOpacityChange: (opacity) => this.updateHeatmapOpacity(opacity),
      onHeatmapColorSchemeChange: (scheme) => this.updateHeatmapColorScheme(scheme),
      onClearHeatmap: () => this.clearHeatmap(),
      onExportHeatmap: () => this.exportHeatmap()
    });
  }

  /**
   * Setup ROI Manager
   */
  setupROIManager() {
    try {
      this.roiManager = new ROIManager(this.canvas, {
        onZonesChanged: (zones) => {
          this.uiController.updateZonesList(zones);
          // Update completePolygon button state
          const drawingMode = document.getElementById('drawingMode').checked;
          const shapeType = document.getElementById('shapeType').value;
          const completeBtn = document.getElementById('completePolygon');
          if (completeBtn) {
            completeBtn.disabled = !drawingMode || shapeType !== 'polygon';
          }
        }
      });

      // Initial zones list update
      this.uiController.updateZonesList(this.roiManager.getAllZones());
    } catch (error) {
      ErrorHandler.handle(error, 'ROI Manager Setup');
    }
  }

  /**
   * Setup Heat Map
   */
  setupHeatMap() {
    try {
      const heatmapCanvas = document.getElementById('heatmapCanvas');
      this.heatMap = new HeatMap(heatmapCanvas, {
        gridSize: 20,
        intensity: 1.0,
        opacity: 0.6,
        radius: 30,
        colorScheme: 'hot'
      });

      console.log('[App] Heat Map initialized');
    } catch (error) {
      ErrorHandler.handle(error, 'Heat Map Setup');
    }
  }

  /**
   * Setup Frame Extractor
   */
  setupFrameExtractor() {
    try {
      this.frameExtractor = new FrameExtractor();

      // Setup event listeners
      const extractionFps = document.getElementById('extractionFps');
      const extractionQuality = document.getElementById('extractionQuality');
      const skipSimilarFrames = document.getElementById('skipSimilarFrames');
      const autoOrganize = document.getElementById('autoOrganize');
      const extractFramesBtn = document.getElementById('extractFramesBtn');
      const previewFramesBtn = document.getElementById('previewFramesBtn');
      const exportAllFrames = document.getElementById('exportAllFrames');
      const exportManifest = document.getElementById('exportManifest');
      const viewFrames = document.getElementById('viewFrames');

      // Update FPS value display
      extractionFps.addEventListener('input', (e) => {
        const fps = parseFloat(e.target.value);
        document.getElementById('extractionFpsValue').textContent = fps.toFixed(1);
        
        // Update hint text dynamically
        const interval = 1 / fps;
        const hintElement = document.getElementById('extractionHint');
        if (hintElement) {
          if (interval < 1) {
            hintElement.textContent = `${fps.toFixed(1)} frames per second`;
          } else if (interval === 1) {
            hintElement.textContent = '1 frame every second';
          } else {
            hintElement.textContent = `1 frame every ${interval.toFixed(1)} seconds`;
          }
        }
        
        this.frameExtractor.updateConfig({ fps });
      });

      // Update quality value display
      extractionQuality.addEventListener('input', (e) => {
        const quality = parseInt(e.target.value);
        document.getElementById('extractionQualityValue').textContent = quality;
        this.frameExtractor.updateConfig({ quality: quality / 100 });
      });

      // Update skip similar frames
      skipSimilarFrames.addEventListener('change', (e) => {
        this.frameExtractor.updateConfig({ skipSimilar: e.target.checked });
      });

      // Update auto organize
      autoOrganize.addEventListener('change', (e) => {
        this.frameExtractor.updateConfig({ autoOrganize: e.target.checked });
      });

      // Extract frames button
      extractFramesBtn.addEventListener('click', () => this.extractFrames());

      // Preview frames button
      previewFramesBtn.addEventListener('click', () => this.previewFrames());

      // Export all frames button
      exportAllFrames.addEventListener('click', () => this.exportAllFrames());

      // Export manifest button
      exportManifest.addEventListener('click', () => this.exportManifest());

      // View frames button
      viewFrames.addEventListener('click', () => this.viewFrames());

      console.log('[App] Frame Extractor initialized');
    } catch (error) {
      ErrorHandler.handle(error, 'Frame Extractor Setup');
    }
  }

  /**
   * Setup Model Selector
   */
  setupModelSelector() {
    const modelSelector = document.getElementById('modelSelector');
    if (modelSelector) {
      modelSelector.addEventListener('change', async (e) => {
        const selectedModel = e.target.value;
        console.log(`[App] Switching to model: ${selectedModel}`);
        
        try {
          await this.loadModel(selectedModel);
          ErrorHandler.showSuccess(`Switched to ${selectedModel === 'yolov8-custom' ? 'Custom YOLOv8' : 'COCO-SSD'} model`);
        } catch (error) {
          ErrorHandler.handle(error, 'Model Switch');
          // Revert selector to previous model
          modelSelector.value = this.currentModel;
        }
      });
    }
  }

  /**
   * Setup Auto-Labeling System
   */
  setupAutoLabeling() {
    try {
      // Initialize auto-labeling engine
      this.autoLabeler = new AutoLabelingEngine(this.detectionEngine);
      
      // Define basic detection classes (COCO-SSD standard classes)
      this.autoLabeler.defineCustomClasses([
        {
          name: 'person',
          color: '#FF6B6B',
          icon: '�',
          description: 'Person detected'
        },
        {
          name: 'car',
          color: '#4ECDC4',
          icon: '🚗',
          description: 'Car/Vehicle'
        },
        {
          name: 'truck',
          color: '#45B7D1',
          icon: '�',
          description: 'Truck'
        },
        {
          name: 'handbag',
          color: '#FFA07A',
          icon: '👜',
          description: 'Handbag/Purse'
        },
        {
          name: 'backpack',
          color: '#98D8C8',
          icon: '🎒',
          description: 'Backpack'
        },
        {
          name: 'bottle',
          color: '#F7DC6F',
          icon: '🍾',
          description: 'Bottle'
        },
        {
          name: 'cell phone',
          color: '#BB8FCE',
          icon: '📱',
          description: 'Cell Phone'
        }
      ]);
      
      // Add mapping rules - Start SIMPLE: detect all people and vehicles
      // Rule 1: Detect all people as "person" (we'll classify them later)
      this.autoLabeler.addMappingRule({
        source: 'person',
        target: 'person',
        condition: 'always',
        minConfidence: 0.5
      });
      
      // Rule 2: Detect all cars as "car"
      this.autoLabeler.addMappingRule({
        source: 'car',
        target: 'car',
        condition: 'always',
        minConfidence: 0.5
      });
      
      // Rule 3: Detect trucks
      this.autoLabeler.addMappingRule({
        source: 'truck',
        target: 'truck',
        condition: 'always',
        minConfidence: 0.5
      });
      
      // Rule 4: Detect handbags (might catch purses/bags with cash)
      this.autoLabeler.addMappingRule({
        source: 'handbag',
        target: 'handbag',
        condition: 'always',
        minConfidence: 0.4
      });
      
      // Rule 5: Detect backpacks
      this.autoLabeler.addMappingRule({
        source: 'backpack',
        target: 'backpack',
        condition: 'always',
        minConfidence: 0.4
      });
      
      console.log('[App] Auto-labeling rules: Detecting people, vehicles, bags');
      
      // Initialize labeling UI (will be created when needed)
      this.labelingUI = null;
      
      // Setup event listeners
      const autoLabelAllBtn = document.getElementById('autoLabelAllBtn');
      const reviewLabelsBtn = document.getElementById('reviewLabelsBtn');
      const exportDatasetBtn = document.getElementById('exportDatasetBtn');
      
      if (autoLabelAllBtn) {
        autoLabelAllBtn.addEventListener('click', () => this.autoLabelAllFrames());
      }
      
      if (reviewLabelsBtn) {
        reviewLabelsBtn.addEventListener('click', () => this.reviewLabels());
      }
      
      if (exportDatasetBtn) {
        exportDatasetBtn.addEventListener('click', () => this.exportDataset());
      }
      
      console.log('[App] Auto-labeling system initialized');
    } catch (error) {
      ErrorHandler.handle(error, 'Auto-Labeling Setup');
    }
  }

  /**
   * Load the AI detection model
   * @async
   */
  async loadModel(modelType = 'coco-ssd') {
    try {
      const statusElement = document.getElementById('modelStatus');
      
      if (modelType === 'yolov8-custom') {
        // Load custom YOLOv8 model
        if (!this.yolov8Engine) {
          this.yolov8Engine = new YOLOv8Engine();
        }
        
        if (statusElement) statusElement.textContent = 'Loading YOLOv8...';
        if (statusElement) statusElement.className = 'model-status loading';
        
        const success = await this.yolov8Engine.loadModel('/models/banking_model.onnx');
        
        if (success) {
          this.currentModel = 'yolov8-custom';
          if (statusElement) statusElement.textContent = '✓ YOLOv8 Ready';
          if (statusElement) statusElement.className = 'model-status ready';
          ErrorHandler.showSuccess('Custom YOLOv8 model loaded!');
        } else {
          throw new Error('Failed to load YOLOv8 model');
        }
      } else {
        // Load COCO-SSD model
        if (statusElement) statusElement.textContent = 'Loading COCO-SSD...';
        if (statusElement) statusElement.className = 'model-status loading';
        
        await this.detectionEngine.loadModel();
        this.currentModel = 'coco-ssd';
        
        if (statusElement) statusElement.textContent = '✓ COCO-SSD Ready';
        if (statusElement) statusElement.className = 'model-status ready';
      }
      
      // Update legacy UI status if exists
      this.uiController.updateModelStatus('Model Ready ✓', 'ready');
    } catch (error) {
      const statusElement = document.getElementById('modelStatus');
      if (statusElement) statusElement.textContent = '✗ Model Failed';
      if (statusElement) statusElement.className = 'model-status error';
      
      this.uiController.updateModelStatus('Model Failed to Load ✗', 'error');
      ErrorHandler.handle(error, 'Model Loading');
      throw error;
    }
  }

  /**
   * Setup video player
   */
  setupVideoPlayer() {
    try {
      this.player = videojs('videoPlayer', {
        controls: true,
        fluid: false,
        preload: 'auto'
      });

      this.canvas = document.getElementById('detectionCanvas');
      this.ctx = this.canvas.getContext('2d');

      // Video metadata loaded
      this.player.on('loadedmetadata', () => {
        this.resizeCanvas();
        this.uiController.setStartAnalysisEnabled(true);
      });

      // Resize canvas when player size changes
      this.player.on('playerresize', () => {
        this.resizeCanvas();
      });

      // Video play event
      this.player.on('play', () => {
        if (this.isAnalyzing) {
          this.startDetectionLoop();
        }
      });

      // Video pause event
      this.player.on('pause', () => {
        this.stopDetectionLoop();
      });

      // Video ended event
      this.player.on('ended', () => {
        if (this.isAnalyzing) {
          this.stopAnalysis();
          ErrorHandler.showInfo('Video analysis complete!');
        }
      });
    } catch (error) {
      ErrorHandler.handle(error, 'Video Player Setup');
    }
  }

  /**
   * Upload a video file
   * @async
   */
  async uploadVideo() {
    try {
      const fileInput = this.uiController.getFileInput();
      const file = fileInput.files[0];

      if (!file) {
        ErrorHandler.showWarning('Please select a video file');
        return;
      }

      // Validate file
      ErrorHandler.validate(
        file.size,
        {
          max: 5 * 1024 * 1024 * 1024,
          validator: (size) => size > 0 || 'File is empty'
        },
        'File size'
      );

      const allowedTypes = [
        'video/mp4',
        'video/avi',
        'video/x-msvideo',
        'video/quicktime',
        'video/x-matroska',
        'video/webm'
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a video file (MP4, AVI, MOV, MKV, WebM)');
      }

      const formData = new FormData();
      formData.append('video', file);

      this.uiController.toggleUploadProgress(true);

      // Upload with progress tracking
      const response = await this.uploadWithProgress(formData);

      if (response.success) {
        ErrorHandler.showSuccess(`Video uploaded successfully: ${response.originalname}`);
        await this.loadVideos();
        this.loadVideo(response.path);
        this.uiController.resetFileInput();
      }

      setTimeout(() => {
        this.uiController.toggleUploadProgress(false);
      }, 1000);
    } catch (error) {
      this.uiController.toggleUploadProgress(false);
      ErrorHandler.handle(error, 'Video Upload');
    }
  }

  /**
   * Upload file with progress tracking
   * @param {FormData} formData - Form data with file
   * @returns {Promise<Object>} Upload response
   */
  uploadWithProgress(formData) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          this.uiController.updateUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  }

  /**
   * Load list of available videos
   * @async
   */
  async loadVideos() {
    try {
      const response = await fetch('/api/videos');
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }

      const videos = await response.json();
      this.uiController.updateVideosList(videos);
    } catch (error) {
      ErrorHandler.handle(error, 'Loading Videos', false);
    }
  }

  /**
   * Load a video into the player
   * @param {string} path - Video path
   */
  loadVideo(path) {
    try {
      this.currentVideoPath = path;
      this.player.src({ type: 'video/mp4', src: path });
      this.player.load();
      this.resetAnalysis();

      // Hide placeholder and show video player
      const placeholder = document.getElementById('videoPlaceholder');
      const videoPlayer = document.getElementById('videoPlayer');
      const videoPlayerElement = this.player.el();

      if (placeholder) {
        placeholder.style.display = 'none';
      }
      if (videoPlayer) {
        videoPlayer.style.display = 'block';
      }
      if (videoPlayerElement) {
        videoPlayerElement.style.display = 'block';
      }

      // Enable start analysis button immediately (will also be set by loadedmetadata)
      this.uiController.setStartAnalysisEnabled(true);

      // Enable frame extraction buttons
      document.getElementById('extractFramesBtn').disabled = false;
      document.getElementById('previewFramesBtn').disabled = false;

      ErrorHandler.showSuccess('Video loaded successfully!');
    } catch (error) {
      ErrorHandler.handle(error, 'Video Playback');
    }
  }

  /**
   * Delete a video
   * @async
   * @param {string} filename - Filename to delete
   */
  async deleteVideo(filename) {
    if (!confirm(`Delete ${filename}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/videos/${filename}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete video');
      }

      ErrorHandler.showSuccess('Video deleted successfully');
      await this.loadVideos();
    } catch (error) {
      ErrorHandler.handle(error, 'Video Deletion');
    }
  }

  /**
   * Start video analysis
   */
  startAnalysis() {
    try {
      if (!this.detectionEngine.isReady()) {
        ErrorHandler.showWarning('AI model not loaded yet. Please wait...');
        return;
      }

      if (!this.currentVideoPath) {
        ErrorHandler.showWarning('Please load a video first');
        return;
      }

      this.isAnalyzing = true;
      this.detectionData = [];
      this.chartManager.clearData();
      this.uiController.clearLog();

      this.uiController.toggleAnalysisControls(true);

      if (this.player.paused()) {
        this.player.play();
      } else {
        this.startDetectionLoop();
      }

      ErrorHandler.showInfo('Analysis started');
    } catch (error) {
      ErrorHandler.handle(error, 'Start Analysis');
    }
  }

  /**
   * Stop video analysis
   */
  stopAnalysis() {
    try {
      this.isAnalyzing = false;
      this.stopDetectionLoop();
      this.uiController.toggleAnalysisControls(false);
      ErrorHandler.showInfo('Analysis stopped');
    } catch (error) {
      ErrorHandler.handle(error, 'Stop Analysis');
    }
  }

  /**
   * Resize canvas to match displayed video player size
   */
  resizeCanvas() {
    const videoElement = this.player.el().querySelector('video');
    if (videoElement) {
      const rect = videoElement.getBoundingClientRect();
      this.canvas.style.width = `${rect.width}px`;
      this.canvas.style.height = `${rect.height}px`;
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
      this.canvas.style.top = `${videoElement.offsetTop}px`;
      this.canvas.style.left = `${videoElement.offsetLeft}px`;

      // Update ROI manager canvas size
      if (this.roiManager) {
        this.roiManager.updateCanvasSize(rect.width, rect.height);
      }

      // Update heat map canvas size
      if (this.heatMap) {
        const heatmapCanvas = document.getElementById('heatmapCanvas');
        heatmapCanvas.style.width = `${rect.width}px`;
        heatmapCanvas.style.height = `${rect.height}px`;
        heatmapCanvas.width = rect.width;
        heatmapCanvas.height = rect.height;
        heatmapCanvas.style.top = `${videoElement.offsetTop}px`;
        heatmapCanvas.style.left = `${videoElement.offsetLeft}px`;
        this.heatMap.resize(rect.width, rect.height);
      }
    }
  }

  /**
   * Reset analysis state
   */
  resetAnalysis() {
    this.stopAnalysis();
    this.detectionData = [];
    this.chartManager.clearData();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.uiController.updateStats({ people: 0, vehicles: 0, total: 0, fps: 0 });
    this.uiController.clearLog();
  }

  /**
   * Start detection loop using requestAnimationFrame
   */
  startDetectionLoop() {
    const frameDuration = 1000 / this.config.detectionFPS;
    let lastFrameTime = 0;

    const detectLoop = async (timestamp) => {
      if (!this.isAnalyzing || this.player.paused()) {
        return;
      }

      // Throttle to configured FPS
      if (timestamp - lastFrameTime >= frameDuration) {
        await this.detectFrame();
        lastFrameTime = timestamp;
      }

      this.animationFrameId = requestAnimationFrame(detectLoop);
    };

    this.animationFrameId = requestAnimationFrame(detectLoop);
  }

  /**
   * Stop detection loop
   */
  stopDetectionLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Detect objects in current video frame
   * @async
   */
  async detectFrame() {
    if (!this.isAnalyzing || this.player.paused()) {
      return;
    }

    try {
      const video = this.player.el().querySelector('video');
      
      // Use appropriate detection engine based on current model
      let result;
      if (this.currentModel === 'yolov8-custom' && this.yolov8Engine && this.yolov8Engine.isReady()) {
        // Use custom YOLOv8 model
        const detections = await this.yolov8Engine.detect(video);
        result = {
          predictions: detections,
          fps: 0 // Will be calculated if needed
        };
      } else {
        // Use COCO-SSD model (pass ROI manager for zone-based filtering)
        result = await this.detectionEngine.detectFrame(video, this.roiManager);
      }

      if (result.predictions && result.predictions.length >= 0) {
        // Redraw zones first (they will be behind detections)
        if (this.roiManager) {
          this.roiManager.redraw();
        }

        // Update heat map with detection locations (scale to canvas size)
        if (this.heatMap) {
          const scaleX = this.canvas.width / video.videoWidth;
          const scaleY = this.canvas.height / video.videoHeight;

          // Scale predictions to canvas coordinates
          const scaledPredictions = result.predictions.map((pred) => ({
            ...pred,
            bbox: [
              pred.bbox[0] * scaleX,
              pred.bbox[1] * scaleY,
              pred.bbox[2] * scaleX,
              pred.bbox[3] * scaleY
            ]
          }));

          this.heatMap.addDetections(scaledPredictions, this.canvas.width, this.canvas.height);
          this.heatMap.render();
        }

        // Draw detections on top of zones
        this.drawDetections(result.predictions);

        // Record data
        const currentTime = this.player.currentTime();
        this.recordDetections(currentTime, result.predictions);

        // Count by category
        const counts = this.detectionEngine.countByCategory(result.predictions);
        counts.fps = result.fps;

        // Update UI
        this.uiController.updateStats(counts);
        this.chartManager.addDataPoint(currentTime, counts);
        this.chartManager.updateChart();
        this.uiController.updateLog(currentTime, result.predictions, {
          isPerson: (cls) => cls === 'person',
          isVehicle: (cls) => this.detectionEngine.vehicleClasses.includes(cls)
        });
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Video Detection', false);
    }
  }

  /**
   * Draw detection bounding boxes on canvas
   * @param {Array} predictions - Array of predictions
   */
  drawDetections(predictions) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Get scaling factors
    const video = this.player.el().querySelector('video');
    const scaleX = this.canvas.width / video.videoWidth;
    const scaleY = this.canvas.height / video.videoHeight;

    predictions.forEach((pred) => {
      const [origX, origY, origWidth, origHeight] = pred.bbox;

      // Scale coordinates to match displayed video size
      const x = origX * scaleX;
      const y = origY * scaleY;
      const width = origWidth * scaleX;
      const height = origHeight * scaleY;

      // Determine color based on category
      const category = this.detectionEngine.classifyPrediction(pred);
      let color = '#f59e0b'; // orange for objects
      if (category === 'person') {
        color = '#10b981';
      } // green
      else if (category === 'vehicle') {
        color = '#ef4444';
      } // red
      else if (category === 'paymentSystem') {
        color = '#ec4899';
      } // pink/magenta

      // Draw bounding box
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(x, y, width, height);

      // Draw label
      const label = `${pred.class} ${Math.round(pred.score * 100)}%`;
      this.ctx.font = '16px Arial';
      const textMetrics = this.ctx.measureText(label);
      const textHeight = 20;

      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y - textHeight - 4, textMetrics.width + 10, textHeight + 4);

      this.ctx.fillStyle = 'white';
      this.ctx.fillText(label, x + 5, y - 8);
    });
  }

  /**
   * Record detections for export
   * @param {number} timestamp - Video timestamp
   * @param {Array} predictions - Predictions array
   */
  recordDetections(timestamp, predictions) {
    this.detectionData.push({
      timestamp: timestamp,
      predictions: predictions.map((p) => ({
        class: p.class,
        score: p.score,
        bbox: p.bbox
      }))
    });

    // Limit stored data for memory management
    if (this.detectionData.length > 1000) {
      this.detectionData = this.detectionData.slice(-500);
    }
  }

  /**
   * Update configuration
   * @param {Object} newConfig - Configuration updates
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.detectionEngine.updateConfig(this.config);

    // Restart detection loop if FPS changed and analyzing
    if (newConfig.detectionFPS !== undefined && this.isAnalyzing && !this.player.paused()) {
      this.stopDetectionLoop();
      this.startDetectionLoop();
    }
  }

  /**
   * Export analysis data
   */
  exportData() {
    try {
      if (this.detectionData.length === 0) {
        ErrorHandler.showWarning('No detection data to export');
        return;
      }

      const metadata = {
        duration: this.player.duration(),
        settings: this.config
      };

      DataExporter.exportJSON(this.detectionData, metadata);
      ErrorHandler.showSuccess('Data exported successfully!');
    } catch (error) {
      ErrorHandler.handle(error, 'Data Export');
    }
  }

  /**
   * Update profile dropdown with preset and custom profiles
   */
  updateProfileDropdown() {
    try {
      const profileSelect = document.getElementById('profileSelect');
      if (!profileSelect) {
        return;
      }

      const profiles = this.profileManager.getAllProfilesList();

      // Clear existing options except first and last
      while (profileSelect.options.length > 5) {
        profileSelect.remove(5);
      }

      // Add custom profiles before the "Custom Profiles..." option
      const customProfilesOption = profileSelect.options[4]; // Last option
      profiles
        .filter((p) => p.id.startsWith('custom_'))
        .forEach((profile) => {
          const option = document.createElement('option');
          option.value = profile.id;
          option.textContent = `💾 ${profile.name}`;
          profileSelect.insertBefore(option, customProfilesOption);
        });
    } catch (error) {
      ErrorHandler.handle(error, 'Update Profile Dropdown');
    }
  }

  /**
   * Load a profile and apply its configuration
   * @param {string} profileId - Profile ID to load
   */
  loadProfile(profileId) {
    try {
      if (!profileId || profileId === 'custom') {
        return;
      }

      const profile = this.profileManager.loadProfile(profileId);
      if (!profile) {
        ErrorHandler.showWarning('Profile not found');
        return;
      }

      // Apply configuration
      this.config = { ...this.config, ...profile.config };
      this.detectionEngine.updateConfig(this.config);

      // Update UI to reflect loaded profile
      this.uiController.elements.detectPeople.checked = profile.config.detectPeople;
      this.uiController.elements.detectVehicles.checked = profile.config.detectVehicles;
      this.uiController.elements.detectAnimals.checked = profile.config.detectAnimals;
      this.uiController.elements.detectSports.checked = profile.config.detectSports;
      this.uiController.elements.detectFurniture.checked = profile.config.detectFurniture;
      this.uiController.elements.detectObjects.checked = profile.config.detectObjects;
      this.uiController.elements.confidenceThreshold.value = profile.config.confidenceThreshold;
      this.uiController.elements.confidenceValue.textContent =
        (profile.config.confidenceThreshold * 100).toFixed(0) + '%';
      this.uiController.elements.detectionFPS.value = profile.config.detectionFPS;
      this.uiController.elements.fpsValue.textContent = profile.config.detectionFPS;

      ErrorHandler.showSuccess(`Profile "${profile.name}" loaded successfully!`);
    } catch (error) {
      ErrorHandler.handle(error, 'Load Profile');
    }
  }

  /**
   * Save current configuration as a new profile
   */
  saveProfile() {
    try {
      const profileName = prompt('Enter profile name:');
      if (!profileName || profileName.trim() === '') {
        return;
      }

      const result = this.profileManager.saveProfile(profileName.trim(), this.config);

      if (result.success) {
        this.updateProfileDropdown();
        ErrorHandler.showSuccess(`Profile "${profileName}" saved successfully!`);
      } else {
        ErrorHandler.showWarning(result.message);
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Save Profile');
    }
  }

  /**
   * Show dialog to load a custom profile
   */
  showLoadProfileDialog() {
    try {
      const customProfiles = this.profileManager.loadAllProfiles();

      if (customProfiles.length === 0) {
        ErrorHandler.showWarning('No custom profiles saved');
        return;
      }

      const profileList = customProfiles.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
      const selection = prompt(
        `Select a profile to load:\n\n${profileList}\n\nEnter profile number:`
      );

      if (selection) {
        const index = parseInt(selection) - 1;
        if (index >= 0 && index < customProfiles.length) {
          const profile = customProfiles[index];
          this.loadProfile(profile.id);

          // Update dropdown selection
          const profileSelect = document.getElementById('profileSelect');
          profileSelect.value = profile.id;
        } else {
          ErrorHandler.showWarning('Invalid selection');
        }
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Show Load Profile Dialog');
    }
  }

  /**
   * Delete a custom profile
   */
  deleteProfile() {
    try {
      const customProfiles = this.profileManager.loadAllProfiles();

      if (customProfiles.length === 0) {
        ErrorHandler.showWarning('No custom profiles to delete');
        return;
      }

      const profileList = customProfiles.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
      const selection = prompt(
        `Select a profile to delete:\n\n${profileList}\n\nEnter profile number:`
      );

      if (selection) {
        const index = parseInt(selection) - 1;
        if (index >= 0 && index < customProfiles.length) {
          const profile = customProfiles[index];
          const confirmed = confirm(`Delete profile "${profile.name}"?\n\nThis cannot be undone.`);

          if (confirmed) {
            const result = this.profileManager.deleteProfile(profile.id);
            if (result.success) {
              this.updateProfileDropdown();
              ErrorHandler.showSuccess(`Profile "${profile.name}" deleted successfully!`);

              // Reset dropdown if deleted profile was selected
              const profileSelect = document.getElementById('profileSelect');
              if (profileSelect.value === profile.id) {
                profileSelect.value = '';
              }
            } else {
              ErrorHandler.showWarning(result.message);
            }
          }
        } else {
          ErrorHandler.showWarning('Invalid selection');
        }
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Delete Profile');
    }
  }

  /**
   * Toggle drawing mode for ROI
   * @param {boolean} enabled - Drawing mode enabled
   */
  toggleDrawingMode(enabled) {
    try {
      if (this.roiManager) {
        this.roiManager.setDrawingMode(enabled);
        const shapeType = document.getElementById('shapeType').value;
        const completeBtn = document.getElementById('completePolygon');
        if (completeBtn) {
          completeBtn.disabled = !enabled || shapeType !== 'polygon';
        }
        ErrorHandler.showSuccess(
          enabled ? 'Drawing mode enabled. Draw on the video.' : 'Drawing mode disabled'
        );
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Toggle Drawing Mode');
    }
  }

  /**
   * Change shape type for ROI drawing
   * @param {string} type - Shape type ('rectangle' or 'polygon')
   */
  changeShapeType(type) {
    try {
      if (this.roiManager) {
        this.roiManager.setShapeType(type);
        const drawingMode = document.getElementById('drawingMode').checked;
        const completeBtn = document.getElementById('completePolygon');
        if (completeBtn) {
          completeBtn.disabled = !drawingMode || type !== 'polygon';
        }
        ErrorHandler.showSuccess(`Shape type changed to ${type}`);
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Change Shape Type');
    }
  }

  /**
   * Complete polygon drawing
   */
  completePolygon() {
    try {
      if (this.roiManager) {
        this.roiManager.completePolygon();
        ErrorHandler.showSuccess('Polygon completed!');
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Complete Polygon');
    }
  }

  /**
   * Clear all ROI zones
   */
  clearAllZones() {
    try {
      if (this.roiManager) {
        const zones = this.roiManager.getAllZones();
        if (zones.length === 0) {
          ErrorHandler.showWarning('No zones to clear');
          return;
        }

        const confirmed = confirm(`Clear all ${zones.length} zone(s)?\n\nThis cannot be undone.`);
        if (confirmed) {
          this.roiManager.clearAllZones();
          ErrorHandler.showSuccess('All zones cleared');
        }
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Clear All Zones');
    }
  }

  /**
   * Export zones as JSON
   */
  exportZones() {
    try {
      if (this.roiManager) {
        const zones = this.roiManager.getAllZones();
        if (zones.length === 0) {
          ErrorHandler.showWarning('No zones to export');
          return;
        }

        const jsonData = this.roiManager.exportZones();
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `roi-zones-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        ErrorHandler.showSuccess(`Exported ${zones.length} zone(s)`);
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Export Zones');
    }
  }

  /**
   * Import zones from JSON
   */
  importZones() {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const jsonData = event.target.result;
              this.roiManager.importZones(jsonData);
              ErrorHandler.showSuccess('Zones imported successfully!');
            } catch (error) {
              ErrorHandler.handle(error, 'Import Zones');
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    } catch (error) {
      ErrorHandler.handle(error, 'Import Zones');
    }
  }

  /**
   * Toggle zone enabled state
   * @param {string} zoneId - Zone ID
   */
  toggleZone(zoneId) {
    try {
      if (this.roiManager) {
        this.roiManager.toggleZone(zoneId);
        ErrorHandler.showSuccess('Zone toggled');
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Toggle Zone');
    }
  }

  /**
   * Rename a zone
   * @param {string} zoneId - Zone ID
   */
  renameZone(zoneId) {
    try {
      const zone = this.roiManager.getAllZones().find((z) => z.id === zoneId);
      if (zone) {
        const newName = prompt('Enter new zone name:', zone.name);
        if (newName && newName.trim()) {
          this.roiManager.renameZone(zoneId, newName.trim());
          ErrorHandler.showSuccess('Zone renamed');
        }
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Rename Zone');
    }
  }

  /**
   * Delete a zone
   * @param {string} zoneId - Zone ID
   */
  deleteZone(zoneId) {
    try {
      const zone = this.roiManager.getAllZones().find((z) => z.id === zoneId);
      if (zone) {
        const confirmed = confirm(`Delete zone "${zone.name}"?\n\nThis cannot be undone.`);
        if (confirmed) {
          this.roiManager.deleteZone(zoneId);
          ErrorHandler.showSuccess('Zone deleted');
        }
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Delete Zone');
    }
  }

  /**
   * Toggle heat map on/off
   * @param {boolean} enabled - Enable/disable heat map
   */
  toggleHeatmap(enabled) {
    try {
      if (!this.heatMap) {
        return;
      }

      if (enabled) {
        this.heatMap.enable();
        document.getElementById('exportHeatmap').disabled = false;
        ErrorHandler.showSuccess('Heat map enabled');
      } else {
        this.heatMap.disable();
        // Clear the heat map canvas
        const heatmapCanvas = document.getElementById('heatmapCanvas');
        const heatmapCtx = heatmapCanvas.getContext('2d');
        heatmapCtx.clearRect(0, 0, heatmapCanvas.width, heatmapCanvas.height);
        ErrorHandler.showSuccess('Heat map disabled');
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Toggle Heat Map');
    }
  }

  /**
   * Update heat map intensity
   * @param {number} intensity - Intensity value (0-2)
   */
  updateHeatmapIntensity(intensity) {
    try {
      if (this.heatMap) {
        this.heatMap.setIntensity(intensity);
        this.heatMap.render();
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Update Heat Map Intensity');
    }
  }

  /**
   * Update heat map opacity
   * @param {number} opacity - Opacity value (0-1)
   */
  updateHeatmapOpacity(opacity) {
    try {
      if (this.heatMap) {
        this.heatMap.setOpacity(opacity);
        this.heatMap.render();
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Update Heat Map Opacity');
    }
  }

  /**
   * Update heat map color scheme
   * @param {string} scheme - Color scheme (hot, cool, rainbow)
   */
  updateHeatmapColorScheme(scheme) {
    try {
      if (this.heatMap) {
        this.heatMap.setColorScheme(scheme);
        this.heatMap.render();
        ErrorHandler.showSuccess(`Color scheme: ${scheme}`);
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Update Heat Map Color Scheme');
    }
  }

  /**
   * Clear heat map data
   */
  clearHeatmap() {
    try {
      if (this.heatMap) {
        const confirmed = confirm('Clear all heat map data?\n\nThis cannot be undone.');
        if (confirmed) {
          this.heatMap.clear();
          ErrorHandler.showSuccess('Heat map cleared');
        }
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Clear Heat Map');
    }
  }

  /**
   * Export heat map as image
   */
  exportHeatmap() {
    try {
      if (this.heatMap) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `heatmap-${timestamp}.png`;
        this.heatMap.downloadImage(filename);
        ErrorHandler.showSuccess('Heat map exported');
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Export Heat Map');
    }
  }

  /**
   * Extract frames from current video
   */
  async extractFrames() {
    try {
      if (!this.player || !this.player.el()) {
        ErrorHandler.showError('No video loaded');
        return;
      }

      const videoElement = this.player.el().querySelector('video');
      if (!videoElement) {
        ErrorHandler.showError('Video element not found');
        return;
      }

      // Check if video is ready
      if (!videoElement.duration || videoElement.duration === Infinity) {
        ErrorHandler.showError('Video not ready. Please wait for video to load completely.');
        return;
      }

      console.log(`[Extract] Video duration: ${videoElement.duration}s`);
      console.log(`[Extract] Video ready state: ${videoElement.readyState}`);

      // Load video into extractor
      await this.frameExtractor.loadVideo(videoElement);

      // Show progress UI
      const progressDiv = document.getElementById('extractionProgress');
      const statsDiv = document.getElementById('extractionStats');
      const statusSpan = document.getElementById('extractionStatus');
      const countSpan = document.getElementById('extractionCount');
      const progressFill = document.getElementById('extractionProgressFill');

      progressDiv.classList.remove('hidden');
      statsDiv.classList.add('hidden');

      // Show labeling section immediately (so user can see what's coming)
      const labelingSectionEarly = document.getElementById('labelingSection');
      if (labelingSectionEarly) {
        labelingSectionEarly.style.display = 'block';
      }

      // Extract frames
      const frames = await this.frameExtractor.extractFrames({
        onProgress: (current, total) => {
          const percent = (current / total) * 100;
          progressFill.style.width = `${percent}%`;
          countSpan.textContent = `${current} / ${total}`;
          statusSpan.textContent = `Extracting... ${percent.toFixed(0)}%`;
        },
        onFrame: (frame, index) => {
          console.log(`Frame ${index} extracted at ${frame.timestamp.toFixed(2)}s`);
        }
      });

      // Hide progress, show stats
      progressDiv.classList.add('hidden');
      statsDiv.classList.remove('hidden');

      // Update stats
      const stats = this.frameExtractor.getStats();
      document.getElementById('statsExtracted').textContent = stats.extractedFrames;
      document.getElementById('statsSkipped').textContent = stats.skippedFrames;
      document.getElementById('statsDuration').textContent =
        `${stats.extractionDuration.toFixed(1)}s`;

      // Show labeling section after successful extraction
      const labelingSection = document.getElementById('labelingSection');
      if (labelingSection) {
        labelingSection.style.display = 'block';
        setTimeout(() => {
          labelingSection.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }

      ErrorHandler.showSuccess(`Extracted ${frames.length} frames successfully!\n\nNow you can auto-label them for training!`);
    } catch (error) {
      ErrorHandler.handle(error, 'Frame Extraction');
      document.getElementById('extractionProgress').classList.add('hidden');
    }
  }

  /**
   * Preview frames (extract first 10 frames)
   */
  async previewFrames() {
    try {
      if (!this.player || !this.player.el()) {
        ErrorHandler.showError('No video loaded');
        return;
      }

      const videoElement = this.player.el().querySelector('video');
      if (!videoElement) {
        ErrorHandler.showError('Video element not found');
        return;
      }

      // Load video into extractor
      await this.frameExtractor.loadVideo(videoElement);

      // Extract only first 20 seconds for preview
      const frames = await this.frameExtractor.extractFrames({
        startTime: 0,
        endTime: Math.min(20, videoElement.duration),
        onProgress: (current, total) => {
          console.log(`Preview: ${current}/${total}`);
        }
      });

      // Show preview in alert (in production, would show in modal)
      ErrorHandler.showSuccess(
        `Preview: ${frames.length} frames would be extracted from first 20 seconds`
      );

      console.log('Preview frames:', frames);
    } catch (error) {
      ErrorHandler.handle(error, 'Frame Preview');
    }
  }

  /**
   * Export all extracted frames
   */
  exportAllFrames() {
    try {
      const frames = this.frameExtractor.getFrames();
      if (frames.length === 0) {
        ErrorHandler.showError('No frames to export. Extract frames first.');
        return;
      }

      const autoOrganize = document.getElementById('autoOrganize').checked;

      // Download frames
      this.frameExtractor.downloadAllFrames({
        organize: autoOrganize,
        prefix: 'banking_frame'
      });

      ErrorHandler.showSuccess(`Downloading ${frames.length} frames... (This may take a moment)`);
    } catch (error) {
      ErrorHandler.handle(error, 'Export Frames');
    }
  }

  /**
   * Export manifest JSON
   */
  exportManifest() {
    try {
      const frames = this.frameExtractor.getFrames();
      if (frames.length === 0) {
        ErrorHandler.showError('No frames to export. Extract frames first.');
        return;
      }

      const autoOrganize = document.getElementById('autoOrganize').checked;

      // Export manifest
      this.frameExtractor.exportFrames({
        filename: 'banking_training_data',
        organize: autoOrganize,
        includeMetadata: true
      });

      ErrorHandler.showSuccess('Manifest exported successfully!');
    } catch (error) {
      ErrorHandler.handle(error, 'Export Manifest');
    }
  }

  /**
   * View extracted frames (console log for now)
   */
  viewFrames() {
    try {
      const frames = this.frameExtractor.getFrames();
      if (frames.length === 0) {
        ErrorHandler.showError('No frames extracted yet');
        return;
      }

      const organized = this.frameExtractor.organizeFrames();
      console.log('Extracted Frames:', frames);
      console.log('Organized by Time Period:', organized);

      // Show summary
      let summary = `Total Frames: ${frames.length}\n\n`;
      Object.keys(organized).forEach((period) => {
        if (organized[period].length > 0) {
          summary += `${period}: ${organized[period].length} frames\n`;
        }
      });

      alert(summary);
    } catch (error) {
      ErrorHandler.handle(error, 'View Frames');
    }
  }

  /**
   * Auto-label all extracted frames
   */
  async autoLabelAllFrames() {
    try {
      const frames = this.frameExtractor.getFrames();
      if (!frames || frames.length === 0) {
        ErrorHandler.showError('No frames to label. Extract frames first!');
        return;
      }

      // Show labeling section
      const labelingSection = document.getElementById('labelingSection');
      if (labelingSection) {
        labelingSection.style.display = 'block';
        labelingSection.scrollIntoView({ behavior: 'smooth' });
      }

      // Show progress UI
      const progressDiv = document.getElementById('autoLabelProgress');
      const statsDiv = document.getElementById('autoLabelStats');
      const statusSpan = document.getElementById('autoLabelStatus');
      const countSpan = document.getElementById('autoLabelCount');
      const progressBar = document.getElementById('autoLabelProgressBar');

      progressDiv.classList.remove('hidden');
      statsDiv.classList.add('hidden');

      // Run auto-labeling
      const result = await this.autoLabeler.batchAutoLabel(
        frames,
        (processed, total, frameResult) => {
          const percent = (processed / total) * 100;
          progressBar.style.width = `${percent}%`;
          countSpan.textContent = `${processed} / ${total}`;
          statusSpan.textContent = `Processing frame ${processed}/${total} - Found ${frameResult.count} objects`;
        }
      );

      // Update stats
      this.updateAutoLabelStats();

      // Hide progress
      progressDiv.classList.add('hidden');

      ErrorHandler.showSuccess(
        `Auto-labeling complete!\n\nLabeled ${result.labeled} frames with ${this.autoLabeler.stats.totalAnnotations} objects.`
      );
    } catch (error) {
      ErrorHandler.handle(error, 'Auto-Labeling');
      document.getElementById('autoLabelProgress').classList.add('hidden');
    }
  }

  /**
   * Update auto-labeling statistics display
   */
  updateAutoLabelStats() {
    const stats = this.autoLabeler.getStats();

    document.getElementById('statTotalFrames').textContent = stats.totalFrames;
    document.getElementById('statLabeledFrames').textContent = stats.labeledFrames;
    document.getElementById('statAutoLabels').textContent = stats.autoLabeled;
    document.getElementById('statManualLabels').textContent = stats.manualLabeled;
    document.getElementById('autoLabelStats').classList.remove('hidden');
  }

  /**
   * Review labels in labeling interface
   */
  reviewLabels() {
    try {
      const frames = this.frameExtractor.getFrames();
      if (!frames || frames.length === 0) {
        ErrorHandler.showError('No frames to review!');
        return;
      }

      // Create labeling interface if not exists
      if (!this.labelingUI) {
        this.labelingUI = new LabelingInterface('labelingInterfaceContainer', this.autoLabeler);
      }

      // Show labeling interface container
      const container = document.getElementById('labelingInterfaceContainer');
      if (container) {
        container.style.display = 'block';
        container.scrollIntoView({ behavior: 'smooth' });
      }

      // Load first frame
      const firstFrame = frames[0];
      this.labelingUI.loadFrame(firstFrame, 'frame_0001');

      ErrorHandler.showSuccess(
        'Labeling interface loaded!\n\n' +
        'Shortcuts:\n' +
        '- Click+Drag: Draw box\n' +
        '- Del: Delete selected\n' +
        '- Ctrl+Z: Undo\n' +
        '- Space: Auto-label current frame'
      );
    } catch (error) {
      ErrorHandler.handle(error, 'Review Labels');
    }
  }

  /**
   * Export labeled dataset
   */
  async exportDataset() {
    try {
      console.log('[Export] Starting dataset export...');
      console.log('[Export] Stats:', this.autoLabeler.stats);
      
      if (this.autoLabeler.stats.totalAnnotations === 0) {
        ErrorHandler.showError('No annotations to export! Label some frames first.');
        return;
      }

      if (typeof JSZip === 'undefined') {
        ErrorHandler.showError('JSZip library not loaded. Please refresh the page.');
        return;
      }

      console.log('[Export] Creating ZIP file...');
      ErrorHandler.showSuccess('Creating dataset ZIP... This may take a moment.');

      // Create ZIP file
      const zip = new JSZip();
      
      // Create folders
      const imagesFolder = zip.folder('images');
      const annotationsFolder = zip.folder('annotations');

      // Export to Roboflow format
      console.log('[Export] Exporting to Roboflow format...');
      const roboflowData = this.autoLabeler.exportToRoboflow();
      console.log('[Export] Roboflow data:', roboflowData);
      
      // Export to YOLO format
      console.log('[Export] Exporting to YOLO format...');
      const yoloData = this.autoLabeler.exportToYOLO();
      console.log('[Export] YOLO data items:', yoloData.length);

      // Get frames from frame extractor
      console.log('[Export] Getting frames...');
      const frames = this.frameExtractor.getFrames();
      console.log('[Export] Total frames:', frames.length);
      
      if (frames.length === 0) {
        ErrorHandler.showError('No frames found! Please extract frames first.');
        return;
      }
      
      const frameMap = new Map();
      
      // Map frames by index for easy lookup
      for (const frame of frames) {
        const frameId = `frame_${String(frame.index).padStart(4, '0')}`;
        frameMap.set(frameId, frame);
      }
      console.log('[Export] Frame map size:', frameMap.size);

      // Add images and YOLO annotations
      let filesAdded = 0;
      for (const yoloItem of yoloData) {
        const frame = frameMap.get(yoloItem.frameId);
        if (frame && frame.dataUrl) {
          // Extract base64 data from dataUrl (remove "data:image/jpeg;base64," prefix)
          const base64Data = frame.dataUrl.split(',')[1];
          
          // Add image to ZIP
          imagesFolder.file(`${yoloItem.frameId}.jpg`, base64Data, { base64: true });
          
          // Add YOLO annotation to ZIP
          annotationsFolder.file(yoloItem.filename, yoloItem.content);
          filesAdded++;
        }
      }
      console.log('[Export] Files added to ZIP:', filesAdded);

      // Add metadata files
      zip.file('dataset.json', JSON.stringify(roboflowData, null, 2));
      zip.file('classes.txt', this.autoLabeler.customClasses.map(c => c.name).join('\n'));
      
      // Add README
      const readme = `# Banking Detection Dataset

Exported: ${new Date().toISOString()}

## Statistics
- Total Frames: ${this.autoLabeler.stats.totalFrames}
- Labeled Frames: ${this.autoLabeler.stats.labeledFrames}
- Total Annotations: ${this.autoLabeler.stats.totalAnnotations}
- Auto-labeled: ${this.autoLabeler.stats.autoLabeledAnnotations}
- Manual: ${this.autoLabeler.stats.manualAnnotations}

## Classes
${this.autoLabeler.customClasses.map(c => `- ${c.name}: ${c.description}`).join('\n')}

## Format
- Images: JPG format in /images folder
- Annotations: YOLO format (txt files) in /annotations folder
- Dataset JSON: Roboflow COCO format in dataset.json
- Classes: Listed in classes.txt

## Upload to Roboflow
1. Create new Object Detection project on Roboflow
2. Upload images from /images folder
3. Upload corresponding annotations from /annotations folder
4. Generate dataset and train model
`;
      zip.file('README.md', readme);

      // Generate ZIP and download
      console.log('[Export] Generating ZIP file...');
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      console.log('[Export] ZIP blob size:', zipBlob.size, 'bytes');

      console.log('[Export] Creating download link...');
      const url = URL.createObjectURL(zipBlob);
      const filename = `banking_dataset_${Date.now()}.zip`;
      
      // Try multiple download methods for better browser compatibility
      try {
        // Method 1: Standard download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Clean up after a delay
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 1000);
        
        console.log('[Export] Download triggered successfully!');
        console.log('[Export] Filename:', filename);
        console.log('[Export] Check your Downloads folder for the ZIP file');
      } catch (downloadError) {
        console.error('[Export] Standard download failed:', downloadError);
        
        // Method 2: Fallback - open in new tab
        window.open(url, '_blank');
        console.log('[Export] Opened in new tab - right-click and Save As...');
      }

      // Show success
      ErrorHandler.showSuccess(
        `Dataset exported as ZIP!\n\n` +
        `Frames: ${frames.length}\n` +
        `Annotations: ${this.autoLabeler.stats.totalAnnotations}\n\n` +
        `Extract the ZIP and upload to Roboflow!`
      );
    } catch (error) {
      console.error('[Export] Error:', error);
      ErrorHandler.handle(error, 'Export Dataset');
    }
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.videoAnalytics = new VideoAnalytics();
  } catch (error) {
    console.error('Failed to initialize application:', error);
  }
});
