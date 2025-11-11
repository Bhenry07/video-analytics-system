/**
 * UI Controller Module
 * Handles all UI updates, user interactions, and DOM manipulation
 * @module UIController
 */

class UIController {
  /**
   * Create a UI controller
   */
  constructor() {
    this.elements = {};
    this.callbacks = {};
  }

  /**
   * Initialize UI elements and cache references
   */
  initialize() {
    // Cache commonly used elements
    this.elements = {
      // Upload
      uploadBtn: document.getElementById('uploadBtn'),
      videoUpload: document.getElementById('videoUpload'),
      uploadProgress: document.getElementById('uploadProgress'),
      progressFill: document.querySelector('.progress-fill'),

      // Video list
      videosList: document.getElementById('videosList'),

      // Controls
      startAnalysis: document.getElementById('startAnalysis'),
      stopAnalysis: document.getElementById('stopAnalysis'),
      exportData: document.getElementById('exportData'),

      // Configuration
      detectPeople: document.getElementById('detectPeople'),
      detectVehicles: document.getElementById('detectVehicles'),
      detectAnimals: document.getElementById('detectAnimals'),
      detectSports: document.getElementById('detectSports'),
      detectFurniture: document.getElementById('detectFurniture'),
      detectPaymentSystems: document.getElementById('detectPaymentSystems'),
      detectObjects: document.getElementById('detectObjects'),
      confidenceThreshold: document.getElementById('confidenceThreshold'),
      confidenceValue: document.getElementById('confidenceValue'),
      detectionFPS: document.getElementById('detectionFPS'),
      fpsValue: document.getElementById('fpsValue'),

      // Profiles
      profileSelect: document.getElementById('profileSelect'),
      saveProfile: document.getElementById('saveProfile'),
      loadProfile: document.getElementById('loadProfile'),
      deleteProfile: document.getElementById('deleteProfile'),

      // ROI Controls
      drawingMode: document.getElementById('drawingMode'),
      shapeType: document.getElementById('shapeType'),
      completePolygon: document.getElementById('completePolygon'),
      clearZones: document.getElementById('clearZones'),
      zonesList: document.getElementById('zonesList'),
      exportZones: document.getElementById('exportZones'),
      importZones: document.getElementById('importZones'),

      // Status
      modelStatus: document.getElementById('modelStatus'),
      statusText: document.querySelector('.status-text'),
      statusDot: document.querySelector('.status-dot'),

      // Stats
      peopleCount: document.getElementById('peopleCount'),
      vehicleCount: document.getElementById('vehicleCount'),
      animalCount: document.getElementById('animalCount'),
      sportsCount: document.getElementById('sportsCount'),
      furnitureCount: document.getElementById('furnitureCount'),
      paymentSystemCount: document.getElementById('paymentSystemCount'),
      objectCount: document.getElementById('objectCount'),
      processingFPS: document.getElementById('processingFPS'),

      // Log
      detectionLog: document.getElementById('detectionLog')
    };
  }

  /**
   * Register callback functions for UI events
   * @param {Object} callbacks - Object with callback functions
   */
  registerCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Upload
    if (this.elements.uploadBtn) {
      this.elements.uploadBtn.addEventListener('click', () => {
        if (this.callbacks.onUpload) {
          this.callbacks.onUpload();
        }
      });
    }

    // Analysis controls
    if (this.elements.startAnalysis) {
      this.elements.startAnalysis.addEventListener('click', () => {
        if (this.callbacks.onStartAnalysis) {
          this.callbacks.onStartAnalysis();
        }
      });
    }

    if (this.elements.stopAnalysis) {
      this.elements.stopAnalysis.addEventListener('click', () => {
        if (this.callbacks.onStopAnalysis) {
          this.callbacks.onStopAnalysis();
        }
      });
    }

    if (this.elements.exportData) {
      this.elements.exportData.addEventListener('click', () => {
        if (this.callbacks.onExportData) {
          this.callbacks.onExportData();
        }
      });
    }

    // Configuration changes
    if (this.elements.detectPeople) {
      this.elements.detectPeople.addEventListener('change', (e) => {
        if (this.callbacks.onConfigChange) {
          this.callbacks.onConfigChange({ detectPeople: e.target.checked });
        }
      });
    }

    if (this.elements.detectVehicles) {
      this.elements.detectVehicles.addEventListener('change', (e) => {
        if (this.callbacks.onConfigChange) {
          this.callbacks.onConfigChange({ detectVehicles: e.target.checked });
        }
      });
    }

    if (this.elements.detectAnimals) {
      this.elements.detectAnimals.addEventListener('change', (e) => {
        if (this.callbacks.onConfigChange) {
          this.callbacks.onConfigChange({ detectAnimals: e.target.checked });
        }
      });
    }

    if (this.elements.detectSports) {
      this.elements.detectSports.addEventListener('change', (e) => {
        if (this.callbacks.onConfigChange) {
          this.callbacks.onConfigChange({ detectSports: e.target.checked });
        }
      });
    }

    if (this.elements.detectFurniture) {
      this.elements.detectFurniture.addEventListener('change', (e) => {
        if (this.callbacks.onConfigChange) {
          this.callbacks.onConfigChange({ detectFurniture: e.target.checked });
        }
      });
    }

    if (this.elements.detectPaymentSystems) {
      this.elements.detectPaymentSystems.addEventListener('change', (e) => {
        if (this.callbacks.onConfigChange) {
          this.callbacks.onConfigChange({ detectPaymentSystems: e.target.checked });
        }
      });
    }

    if (this.elements.detectObjects) {
      this.elements.detectObjects.addEventListener('change', (e) => {
        if (this.callbacks.onConfigChange) {
          this.callbacks.onConfigChange({ detectObjects: e.target.checked });
        }
      });
    }

    if (this.elements.confidenceThreshold) {
      this.elements.confidenceThreshold.addEventListener('input', (e) => {
        const value = e.target.value;
        this.elements.confidenceValue.textContent = value;
        if (this.callbacks.onConfigChange) {
          this.callbacks.onConfigChange({ confidenceThreshold: value / 100 });
        }
      });
    }

    if (this.elements.detectionFPS) {
      this.elements.detectionFPS.addEventListener('input', (e) => {
        const value = e.target.value;
        this.elements.fpsValue.textContent = value;
        if (this.callbacks.onConfigChange) {
          this.callbacks.onConfigChange({ detectionFPS: parseInt(value) });
        }
      });
    }

    // Profile controls
    if (this.elements.profileSelect) {
      this.elements.profileSelect.addEventListener('change', (e) => {
        if (this.callbacks.onProfileSelect) {
          this.callbacks.onProfileSelect(e.target.value);
        }
      });
    }

    if (this.elements.saveProfile) {
      this.elements.saveProfile.addEventListener('click', () => {
        if (this.callbacks.onSaveProfile) {
          this.callbacks.onSaveProfile();
        }
      });
    }

    if (this.elements.loadProfile) {
      this.elements.loadProfile.addEventListener('click', () => {
        if (this.callbacks.onLoadProfile) {
          this.callbacks.onLoadProfile();
        }
      });
    }

    if (this.elements.deleteProfile) {
      this.elements.deleteProfile.addEventListener('click', () => {
        if (this.callbacks.onDeleteProfile) {
          this.callbacks.onDeleteProfile();
        }
      });
    }

    // ROI controls
    if (this.elements.drawingMode) {
      this.elements.drawingMode.addEventListener('change', (e) => {
        if (this.callbacks.onDrawingModeChange) {
          this.callbacks.onDrawingModeChange(e.target.checked);
        }
      });
    }

    if (this.elements.shapeType) {
      this.elements.shapeType.addEventListener('change', (e) => {
        if (this.callbacks.onShapeTypeChange) {
          this.callbacks.onShapeTypeChange(e.target.value);
        }
      });
    }

    if (this.elements.completePolygon) {
      this.elements.completePolygon.addEventListener('click', () => {
        if (this.callbacks.onCompletePolygon) {
          this.callbacks.onCompletePolygon();
        }
      });
    }

    if (this.elements.clearZones) {
      this.elements.clearZones.addEventListener('click', () => {
        if (this.callbacks.onClearZones) {
          this.callbacks.onClearZones();
        }
      });
    }

    if (this.elements.exportZones) {
      this.elements.exportZones.addEventListener('click', () => {
        if (this.callbacks.onExportZones) {
          this.callbacks.onExportZones();
        }
      });
    }

    if (this.elements.importZones) {
      this.elements.importZones.addEventListener('click', () => {
        if (this.callbacks.onImportZones) {
          this.callbacks.onImportZones();
        }
      });
    }

    // Heat map controls
    const heatmapEnabled = document.getElementById('heatmapEnabled');
    const heatmapIntensity = document.getElementById('heatmapIntensity');
    const heatmapOpacity = document.getElementById('heatmapOpacity');
    const heatmapColorScheme = document.getElementById('heatmapColorScheme');
    const clearHeatmap = document.getElementById('clearHeatmap');
    const exportHeatmap = document.getElementById('exportHeatmap');

    if (heatmapEnabled) {
      heatmapEnabled.addEventListener('change', (e) => {
        if (this.callbacks.onHeatmapToggle) {
          this.callbacks.onHeatmapToggle(e.target.checked);
        }
      });
    }

    if (heatmapIntensity) {
      heatmapIntensity.addEventListener('input', (e) => {
        const value = e.target.value / 100;
        document.getElementById('intensityValue').textContent = value.toFixed(1);
        if (this.callbacks.onHeatmapIntensityChange) {
          this.callbacks.onHeatmapIntensityChange(value);
        }
      });
    }

    if (heatmapOpacity) {
      heatmapOpacity.addEventListener('input', (e) => {
        const value = e.target.value;
        document.getElementById('opacityValue').textContent = `${value}%`;
        if (this.callbacks.onHeatmapOpacityChange) {
          this.callbacks.onHeatmapOpacityChange(value / 100);
        }
      });
    }

    if (heatmapColorScheme) {
      heatmapColorScheme.addEventListener('change', (e) => {
        if (this.callbacks.onHeatmapColorSchemeChange) {
          this.callbacks.onHeatmapColorSchemeChange(e.target.value);
        }
      });
    }

    if (clearHeatmap) {
      clearHeatmap.addEventListener('click', () => {
        if (this.callbacks.onClearHeatmap) {
          this.callbacks.onClearHeatmap();
        }
      });
    }

    if (exportHeatmap) {
      exportHeatmap.addEventListener('click', () => {
        if (this.callbacks.onExportHeatmap) {
          this.callbacks.onExportHeatmap();
        }
      });
    }
  }

  /**
   * Update zones list display
   * @param {Array} zones - Array of zone objects
   */
  updateZonesList(zones) {
    if (!this.elements.zonesList) {
      return;
    }

    if (!zones || zones.length === 0) {
      this.elements.zonesList.innerHTML =
        '<p class="empty-message">No zones defined. Enable drawing mode and draw on the video.</p>';
      if (this.elements.exportZones) {
        this.elements.exportZones.disabled = true;
      }
      return;
    }

    let html = '';
    zones.forEach((zone) => {
      html += `
        <div class="zone-item ${!zone.enabled ? 'disabled' : ''}" data-zone-id="${zone.id}">
          <div class="zone-color" style="background: ${zone.color}"></div>
          <div class="zone-info">
            <div class="zone-name">${zone.name}</div>
            <div class="zone-details">${zone.type} • ${zone.enabled ? 'Enabled' : 'Disabled'}</div>
          </div>
          <div class="zone-controls">
            <button class="zone-btn toggle" onclick="window.videoAnalytics.toggleZone('${zone.id}')" title="Toggle">
              ${zone.enabled ? '👁️' : '🚫'}
            </button>
            <button class="zone-btn rename" onclick="window.videoAnalytics.renameZone('${zone.id}')" title="Rename">
              ✏️
            </button>
            <button class="zone-btn delete" onclick="window.videoAnalytics.deleteZone('${zone.id}')" title="Delete">
              🗑️
            </button>
          </div>
        </div>
      `;
    });

    this.elements.zonesList.innerHTML = html;

    if (this.elements.exportZones) {
      this.elements.exportZones.disabled = false;
    }
  }

  /**
   * Update model status display
   * @param {string} status - Status text
   * @param {string} state - State: 'loading', 'ready', 'error'
   */
  updateModelStatus(status, state = 'ready') {
    if (this.elements.statusText) {
      this.elements.statusText.textContent = status;
    }

    if (this.elements.statusDot) {
      this.elements.statusDot.classList.remove('loading');

      switch (state) {
        case 'loading':
          this.elements.statusDot.classList.add('loading');
          this.elements.statusDot.style.background = '#f59e0b';
          break;
        case 'ready':
          this.elements.statusDot.style.background = '#10b981';
          break;
        case 'error':
          this.elements.statusDot.style.background = '#ef4444';
          break;
      }
    }
  }

  /**
   * Update statistics display
   * @param {Object} stats - Statistics object
   */
  updateStats(stats) {
    if (this.elements.peopleCount) {
      this.elements.peopleCount.textContent = stats.people || 0;
    }
    if (this.elements.vehicleCount) {
      this.elements.vehicleCount.textContent = stats.vehicles || 0;
    }
    if (this.elements.animalCount) {
      this.elements.animalCount.textContent = stats.animals || 0;
    }
    if (this.elements.sportsCount) {
      this.elements.sportsCount.textContent = stats.sports || 0;
    }
    if (this.elements.furnitureCount) {
      this.elements.furnitureCount.textContent = stats.furniture || 0;
    }
    if (this.elements.paymentSystemCount) {
      this.elements.paymentSystemCount.textContent = stats.paymentSystems || 0;
    }
    if (this.elements.objectCount) {
      this.elements.objectCount.textContent = stats.total || 0;
    }
    if (this.elements.processingFPS && stats.fps !== undefined) {
      this.elements.processingFPS.textContent = stats.fps;
    }
  }

  /**
   * Update detection log
   * @param {number} timestamp - Video timestamp
   * @param {Array} predictions - Array of predictions
   * @param {Object} categories - Categories helper object
   */
  updateLog(timestamp, predictions, categories) {
    if (!this.elements.detectionLog) {
      return;
    }

    if (predictions.length === 0) {
      return;
    }

    const entry = document.createElement('div');

    // Determine entry class based on detection type
    const hasPerson = predictions.some((p) => categories.isPerson(p.class));
    const hasVehicle = predictions.some((p) => categories.isVehicle(p.class));

    let entryClass = 'object';
    if (hasPerson) {
      entryClass = 'person';
    } else if (hasVehicle) {
      entryClass = 'vehicle';
    }

    entry.className = `log-entry ${entryClass}`;

    // Create summary
    const summary = predictions.reduce((acc, p) => {
      acc[p.class] = (acc[p.class] || 0) + 1;
      return acc;
    }, {});

    const summaryText = Object.entries(summary)
      .map(([cls, count]) => `${count}x ${cls}`)
      .join(', ');

    entry.innerHTML = `
            <span class="time">[${this.formatTime(timestamp)}]</span> 
            <span class="detection">${summaryText}</span>
        `;

    this.elements.detectionLog.insertBefore(entry, this.elements.detectionLog.firstChild);

    // Keep only last 100 entries
    while (this.elements.detectionLog.children.length > 100) {
      this.elements.detectionLog.removeChild(this.elements.detectionLog.lastChild);
    }
  }

  /**
   * Clear detection log
   */
  clearLog() {
    if (this.elements.detectionLog) {
      this.elements.detectionLog.innerHTML = '';
    }
  }

  /**
   * Show/hide analysis controls
   * @param {boolean} isAnalyzing - Whether analysis is active
   */
  toggleAnalysisControls(isAnalyzing) {
    if (isAnalyzing) {
      this.elements.startAnalysis?.classList.add('hidden');
      this.elements.stopAnalysis?.classList.remove('hidden');
      if (this.elements.exportData) {
        this.elements.exportData.disabled = false;
      }
    } else {
      this.elements.startAnalysis?.classList.remove('hidden');
      this.elements.stopAnalysis?.classList.add('hidden');
    }
  }

  /**
   * Enable/disable start analysis button
   * @param {boolean} enabled - Whether button should be enabled
   */
  setStartAnalysisEnabled(enabled) {
    if (this.elements.startAnalysis) {
      this.elements.startAnalysis.disabled = !enabled;
    }
  }

  /**
   * Update upload progress
   * @param {number} percentage - Progress percentage (0-100)
   */
  updateUploadProgress(percentage) {
    if (this.elements.progressFill) {
      this.elements.progressFill.style.width = `${percentage}%`;
    }
  }

  /**
   * Show/hide upload progress bar
   * @param {boolean} show - Whether to show progress bar
   */
  toggleUploadProgress(show) {
    if (this.elements.uploadProgress) {
      if (show) {
        this.elements.uploadProgress.classList.remove('hidden');
      } else {
        this.elements.uploadProgress.classList.add('hidden');
        if (this.elements.progressFill) {
          this.elements.progressFill.style.width = '0%';
        }
      }
    }
  }

  /**
   * Populate videos list
   * @param {Array} videos - Array of video objects
   */
  updateVideosList(videos) {
    if (!this.elements.videosList) {
      return;
    }

    this.elements.videosList.innerHTML = '';

    if (videos.length === 0) {
      this.elements.videosList.innerHTML =
        '<p style="color: #9ca3af; font-size: 0.85em;">No videos uploaded yet</p>';
      return;
    }

    videos.forEach((video) => {
      const item = document.createElement('div');
      item.className = 'video-item';
      item.innerHTML = `
                <span class="video-item-name" title="${video.filename}">${video.filename}</span>
                <button class="video-item-delete" data-filename="${video.filename}">🗑️</button>
            `;

      // Video selection
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('video-item-delete')) {
          if (this.callbacks.onVideoSelect) {
            this.callbacks.onVideoSelect(video);
          }
          document.querySelectorAll('.video-item').forEach((el) => el.classList.remove('active'));
          item.classList.add('active');
        }
      });

      // Video deletion
      const deleteBtn = item.querySelector('.video-item-delete');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.callbacks.onVideoDelete) {
          this.callbacks.onVideoDelete(video.filename);
        }
      });

      this.elements.videosList.appendChild(item);
    });
  }

  /**
   * Reset file input
   */
  resetFileInput() {
    if (this.elements.videoUpload) {
      this.elements.videoUpload.value = '';
    }
  }

  /**
   * Format time in seconds to MM:SS
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get file input element
   * @returns {HTMLInputElement} File input element
   */
  getFileInput() {
    return this.elements.videoUpload;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIController;
}
