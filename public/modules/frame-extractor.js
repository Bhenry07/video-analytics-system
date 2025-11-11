/**
 * Frame Extractor Module
 *
 * Extracts frames from videos for training data collection.
 * Supports configurable extraction rates, quality settings, and auto-organization.
 *
 * Features:
 * - Canvas-based frame extraction
 * - Configurable FPS (0.1 - 30 fps)
 * - Quality/resolution controls
 * - Duplicate frame detection
 * - Time-based organization
 * - Batch export with metadata
 * - Preview before export
 */

class FrameExtractor {
  constructor() {
    this.video = null;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.frames = [];
    this.isExtracting = false;

    // Configuration
    this.config = {
      fps: 0.5, // Frames per second (0.5 = 1 frame every 2 seconds)
      quality: 0.95, // JPEG quality (0-1)
      maxWidth: 1920, // Max frame width
      maxHeight: 1080, // Max frame height
      skipSimilar: false, // Skip similar frames (duplicate detection) - DISABLED for now
      similarityThreshold: 0.985, // How similar is "duplicate" (0-1) - 98.5% match required to skip
      format: 'image/jpeg', // Output format
      autoOrganize: true, // Auto-organize by time period
      includeMetadata: true // Include metadata in export
    };

    // Extraction state
    this.extractionStats = {
      totalFrames: 0,
      extractedFrames: 0,
      skippedFrames: 0,
      startTime: null,
      endTime: null,
      videoDuration: 0
    };
  }

  /**
   * Initialize with video element
   */
  loadVideo(videoElement) {
    this.video = videoElement;

    // Wait for video metadata
    return new Promise((resolve, reject) => {
      if (this.video.readyState >= 2) {
        this.setupCanvas();
        resolve();
      } else {
        this.video.addEventListener(
          'loadedmetadata',
          () => {
            this.setupCanvas();
            resolve();
          },
          { once: true }
        );

        this.video.addEventListener('error', reject, { once: true });
      }
    });
  }

  /**
   * Setup canvas dimensions based on video size
   */
  setupCanvas() {
    let width = this.video.videoWidth;
    let height = this.video.videoHeight;

    // Respect max dimensions while maintaining aspect ratio
    if (width > this.config.maxWidth) {
      height = Math.round(height * (this.config.maxWidth / width));
      width = this.config.maxWidth;
    }
    if (height > this.config.maxHeight) {
      width = Math.round(width * (this.config.maxHeight / height));
      height = this.config.maxHeight;
    }

    this.canvas.width = width;
    this.canvas.height = height;

    console.log(`Canvas setup: ${width}x${height}`);
  }

  /**
   * Extract frames from video
   *
   * @param {Object} options - Extraction options
   * @param {Number} options.startTime - Start time in seconds (default: 0)
   * @param {Number} options.endTime - End time in seconds (default: video duration)
   * @param {Function} options.onProgress - Progress callback (current, total)
   * @param {Function} options.onFrame - Frame extracted callback (frame, index)
   * @returns {Promise<Array>} Array of extracted frames
   */
  async extractFrames(options = {}) {
    if (!this.video) {
      throw new Error('No video loaded. Call loadVideo() first.');
    }

    if (this.isExtracting) {
      throw new Error('Extraction already in progress');
    }

    // Setup extraction parameters
    const startTime = options.startTime || 0;
    const endTime = options.endTime || this.video.duration;
    const interval = 1 / this.config.fps; // Seconds between frames

    this.isExtracting = true;
    this.frames = [];
    this.extractionStats = {
      totalFrames: Math.ceil((endTime - startTime) * this.config.fps),
      extractedFrames: 0,
      skippedFrames: 0,
      startTime: new Date(),
      endTime: null,
      videoDuration: this.video.duration
    };

    console.log(`Starting extraction: ${this.extractionStats.totalFrames} frames expected`);
    console.log(`Interval: ${interval}s (${this.config.fps} fps)`);

    try {
      let currentTime = startTime;
      let frameIndex = 0;
      let lastFrameData = null;

      console.log(`[Extraction Loop] Starting: currentTime=${currentTime}, endTime=${endTime}, interval=${interval}`);

      while (currentTime <= endTime) {
        console.log(`[Loop ${frameIndex}] Processing time ${currentTime.toFixed(2)}s / ${endTime.toFixed(2)}s`);

        // Seek to specific time
        try {
          await this.seekTo(currentTime);
        } catch (seekError) {
          console.error(`[Seek Error] Failed to seek to ${currentTime}s:`, seekError);
          currentTime += interval;
          continue;
        }

        // Capture frame
        let frameData;
        try {
          frameData = this.captureFrame();
        } catch (captureError) {
          console.error(`[Capture Error] Failed to capture frame at ${currentTime}s:`, captureError);
          currentTime += interval;
          continue;
        }

        // Check if frame is similar to last frame (duplicate detection)
        if (this.config.skipSimilar && lastFrameData) {
          try {
            const similarity = this.compareFrames(lastFrameData, frameData);
            console.log(`Frame at ${currentTime.toFixed(2)}s: similarity = ${similarity.toFixed(3)}`);
            if (similarity > this.config.similarityThreshold) {
              this.extractionStats.skippedFrames++;
              console.log(
                `⏭️ SKIPPED duplicate frame at ${currentTime.toFixed(2)}s (similarity: ${similarity.toFixed(3)} > ${this.config.similarityThreshold})`
              );
              currentTime += interval;
              continue;
            }
          } catch (compareError) {
            console.warn(`[Compare Error] Failed to compare frames at ${currentTime}s:`, compareError);
            // Continue anyway without skipping
          }
        }

        // Create frame object
        const frame = {
          index: frameIndex,
          timestamp: currentTime,
          dataUrl: frameData,
          metadata: this.getFrameMetadata(currentTime)
        };

        this.frames.push(frame);
        this.extractionStats.extractedFrames++;
        lastFrameData = frameData;

        console.log(`✅ Frame ${frameIndex} extracted at ${currentTime.toFixed(2)}s`);

        // Progress callback
        if (options.onProgress) {
          options.onProgress(frameIndex + 1, this.extractionStats.totalFrames);
        }

        // Frame callback
        if (options.onFrame) {
          options.onFrame(frame, frameIndex);
        }

        frameIndex++;
        currentTime += interval;
      }

      console.log(`[Extraction Loop] Completed: extracted ${frameIndex} frames`);

      this.extractionStats.endTime = new Date();
      this.isExtracting = false;

      console.log(
        `Extraction complete: ${this.extractionStats.extractedFrames} frames extracted, ${this.extractionStats.skippedFrames} skipped`
      );

      return this.frames;
    } catch (error) {
      this.isExtracting = false;
      console.error('Extraction error:', error);
      throw error;
    }
  }

  /**
   * Seek video to specific time
   */
  seekTo(time) {
    return new Promise((resolve) => {
      const onSeeked = () => {
        this.video.removeEventListener('seeked', onSeeked);
        // Minimal delay to ensure frame is rendered
        setTimeout(resolve, 10);
      };

      this.video.addEventListener('seeked', onSeeked);
      this.video.currentTime = time;
    });
  }

  /**
   * Capture current video frame to canvas
   */
  captureFrame() {
    // Draw video frame to canvas
    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

    // Convert to data URL
    return this.canvas.toDataURL(this.config.format, this.config.quality);
  }

  /**
   * Compare two frames for similarity (simple pixel comparison)
   */
  compareFrames(dataUrl1, dataUrl2) {
    // For performance, compare a subset of pixels
    // This is a simplified version - can be enhanced with perceptual hashing

    // Convert to grayscale and compare
    const img1 = this.dataUrlToImageData(dataUrl1);
    const img2 = this.dataUrlToImageData(dataUrl2);

    if (!img1 || !img2) {
      return 0;
    }

    // Sample every 10th pixel for performance
    let matches = 0;
    let samples = 0;
    const threshold = 10; // Pixel difference threshold

    for (let i = 0; i < img1.data.length; i += 40) {
      // Sample every 10th pixel (4 bytes per pixel)
      const r1 = img1.data[i];
      const g1 = img1.data[i + 1];
      const b1 = img1.data[i + 2];

      const r2 = img2.data[i];
      const g2 = img2.data[i + 1];
      const b2 = img2.data[i + 2];

      // Calculate grayscale difference
      const gray1 = (r1 + g1 + b1) / 3;
      const gray2 = (r2 + g2 + b2) / 3;
      const diff = Math.abs(gray1 - gray2);

      if (diff < threshold) {
        matches++;
      }
      samples++;
    }

    return matches / samples;
  }

  /**
   * Convert data URL to ImageData for comparison
   */
  dataUrlToImageData(dataUrl) {
    try {
      // Use a small canvas for comparison (faster)
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      const img = new Image();
      img.src = dataUrl;

      // Scale down for faster comparison
      tempCanvas.width = 100;
      tempCanvas.height = 100;
      tempCtx.drawImage(this.canvas, 0, 0, 100, 100);

      return tempCtx.getImageData(0, 0, 100, 100);
    } catch (error) {
      console.error('Error converting to ImageData:', error);
      return null;
    }
  }

  /**
   * Get metadata for frame
   */
  getFrameMetadata(timestamp) {
    const date = new Date();
    const hours = date.getHours();

    // Determine time period
    let timePeriod = 'unknown';
    if (hours >= 7 && hours < 10) {
      timePeriod = 'morning_rush';
    } else if (hours >= 10 && hours < 14) {
      timePeriod = 'midday';
    } else if (hours >= 14 && hours < 17) {
      timePeriod = 'afternoon';
    } else if (hours >= 17 && hours < 20) {
      timePeriod = 'evening_rush';
    } else {
      timePeriod = 'night';
    }

    return {
      timestamp: timestamp,
      timePeriod: timePeriod,
      extractedAt: date.toISOString(),
      videoWidth: this.video.videoWidth,
      videoHeight: this.video.videoHeight,
      canvasWidth: this.canvas.width,
      canvasHeight: this.canvas.height,
      format: this.config.format,
      quality: this.config.quality
    };
  }

  /**
   * Organize frames by time period
   */
  organizeFrames() {
    const organized = {
      morning_rush: [],
      midday: [],
      afternoon: [],
      evening_rush: [],
      night: [],
      unknown: []
    };

    this.frames.forEach((frame) => {
      const period = frame.metadata.timePeriod;
      if (organized[period]) {
        organized[period].push(frame);
      } else {
        organized.unknown.push(frame);
      }
    });

    return organized;
  }

  /**
   * Export frames as ZIP file
   */
  async exportFrames(options = {}) {
    const {
      filename = 'frames_export',
      organize = this.config.autoOrganize,
      includeMetadata = this.config.includeMetadata
    } = options;

    if (this.frames.length === 0) {
      throw new Error('No frames to export');
    }

    // Note: For full ZIP export, would need JSZip library
    // For now, download frames individually or as JSON manifest

    if (organize) {
      return this.exportOrganized(filename, includeMetadata);
    } else {
      return this.exportFlat(filename, includeMetadata);
    }
  }

  /**
   * Export frames organized by time period
   */
  exportOrganized(filename, includeMetadata) {
    const organized = this.organizeFrames();
    const manifest = {
      exportDate: new Date().toISOString(),
      totalFrames: this.frames.length,
      extractionStats: this.extractionStats,
      periods: {}
    };

    Object.keys(organized).forEach((period) => {
      const frames = organized[period];
      manifest.periods[period] = {
        count: frames.length,
        frames: frames.map((f, i) => ({
          filename: `${period}_frame_${String(i).padStart(4, '0')}.jpg`,
          timestamp: f.timestamp,
          metadata: includeMetadata ? f.metadata : null
        }))
      };
    });

    // Download manifest
    this.downloadJSON(manifest, `${filename}_manifest.json`);

    console.log('Organized export:', manifest);
    return manifest;
  }

  /**
   * Export frames as flat list
   */
  exportFlat(filename, includeMetadata) {
    const manifest = {
      exportDate: new Date().toISOString(),
      totalFrames: this.frames.length,
      extractionStats: this.extractionStats,
      frames: this.frames.map((f, i) => ({
        filename: `frame_${String(i).padStart(4, '0')}.jpg`,
        timestamp: f.timestamp,
        metadata: includeMetadata ? f.metadata : null
      }))
    };

    // Download manifest
    this.downloadJSON(manifest, `${filename}_manifest.json`);

    console.log('Flat export:', manifest);
    return manifest;
  }

  /**
   * Download individual frame as image
   */
  downloadFrame(frame, filename) {
    if (!filename) {
      filename = `frame_${String(frame.index).padStart(4, '0')}.jpg`;
    }

    const link = document.createElement('a');
    link.download = filename;
    link.href = frame.dataUrl;
    link.click();
  }

  /**
   * Download all frames as individual images
   */
  downloadAllFrames(options = {}) {
    const { organize = false, prefix = 'frame' } = options;

    if (organize) {
      const organized = this.organizeFrames();

      Object.keys(organized).forEach((period) => {
        organized[period].forEach((frame, i) => {
          const filename = `${period}_${prefix}_${String(i).padStart(4, '0')}.jpg`;
          // Delay downloads to avoid browser blocking
          setTimeout(() => {
            this.downloadFrame(frame, filename);
          }, i * 100);
        });
      });
    } else {
      this.frames.forEach((frame, i) => {
        const filename = `${prefix}_${String(i).padStart(4, '0')}.jpg`;
        // Delay downloads to avoid browser blocking
        setTimeout(() => {
          this.downloadFrame(frame, filename);
        }, i * 100);
      });
    }
  }

  /**
   * Download JSON file
   */
  downloadJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Get extraction statistics
   */
  getStats() {
    const duration =
      this.extractionStats.endTime && this.extractionStats.startTime
        ? (this.extractionStats.endTime - this.extractionStats.startTime) / 1000
        : 0;

    return {
      ...this.extractionStats,
      extractionDuration: duration,
      framesPerSecond:
        duration > 0 ? (this.extractionStats.extractedFrames / duration).toFixed(2) : 0,
      skipRate:
        this.extractionStats.totalFrames > 0
          ? ((this.extractionStats.skippedFrames / this.extractionStats.totalFrames) * 100).toFixed(
              1
            )
          : 0
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('Config updated:', this.config);
  }

  /**
   * Clear extracted frames
   */
  clear() {
    this.frames = [];
    this.extractionStats = {
      totalFrames: 0,
      extractedFrames: 0,
      skippedFrames: 0,
      startTime: null,
      endTime: null,
      videoDuration: 0
    };
  }

  /**
   * Get frames
   */
  getFrames() {
    return this.frames;
  }
}

// Export for use in app
// Using global scope for consistency with other modules
window.FrameExtractor = FrameExtractor;
