/**
 * Video Analytics - Main Application File (Refactored)
 * Integrates all modules: DetectionEngine, ChartManager, UIController, DataExporter, ErrorHandler
 * @author Video Analytics System
 * @version 2.0.0
 */

/* global ProfileManager */

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
    this.chartManager = null;
    this.uiController = null;
    this.profileManager = null;

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
      onDeleteProfile: () => this.deleteProfile()
    });
  }

  /**
   * Load the AI detection model
   * @async
   */
  async loadModel() {
    try {
      this.uiController.updateModelStatus('Loading AI Model...', 'loading');
      await this.detectionEngine.loadModel();
      this.uiController.updateModelStatus('Model Ready ✓', 'ready');
    } catch (error) {
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
      const result = await this.detectionEngine.detectFrame(video);

      if (result.predictions && result.predictions.length >= 0) {
        // Draw detections
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
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  try {
    const _analytics = new VideoAnalytics();
  } catch (error) {
    console.error('Failed to initialize application:', error);
  }
});
