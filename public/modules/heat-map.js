/**
 * HeatMap Module
 *
 * Tracks detection locations and generates heat map visualizations
 * showing where objects are detected most frequently in the video.
 *
 * Features:
 * - Grid-based tracking for performance
 * - Configurable intensity and opacity
 * - Multiple visualization modes (gradient, solid)
 * - Real-time updates
 * - Export heat map as image
 *
 * @module HeatMap
 */

class HeatMap {
  /**
   * Initialize the heat map manager
   * @param {HTMLCanvasElement} canvas - Canvas element for rendering heat map
   * @param {Object} options - Configuration options
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Configuration
    this.config = {
      gridSize: options.gridSize || 25, // Size of each grid cell in pixels
      intensity: options.intensity || 1.0, // Heat intensity multiplier (0-2)
      opacity: options.opacity || 0.5, // Heat map opacity (0-1) - slightly more transparent
      radius: options.radius || 50, // Heat point radius - larger for smoother look
      maxIntensity: options.maxIntensity || 50, // Max intensity before saturation - lower for faster buildup
      colorScheme: options.colorScheme || 'hot', // Color scheme: hot, cool, rainbow
      blur: options.blur || 8, // Blur radius for smooth gradients - less blur for clarity
      ...options
    };

    // Heat data storage (grid-based for performance)
    this.heatData = new Map(); // key: "x,y", value: intensity count

    // Tracking state
    this.enabled = false;
    this.maxValue = 0; // Track maximum intensity value for normalization

    // Off-screen canvas for heat map rendering (performance optimization)
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');

    this.initialize();
  }

  /**
   * Initialize the heat map
   */
  initialize() {
    this.offscreenCanvas.width = this.canvas.width;
    this.offscreenCanvas.height = this.canvas.height;
    console.log('[HeatMap] Initialized', {
      gridSize: this.config.gridSize,
      canvasSize: `${this.canvas.width}x${this.canvas.height}`
    });
  }

  /**
   * Update canvas size (call when video dimensions change)
   * @param {number} width - New canvas width
   * @param {number} height - New canvas height
   */
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
    console.log('[HeatMap] Resized', { width, height });
  }

  /**
   * Add detection points to heat map
   * @param {Array} predictions - Array of detection predictions with bbox
   * @param {number} _videoWidth - Video width for coordinate normalization
   * @param {number} _videoHeight - Video height for coordinate normalization
   */
  addDetections(predictions, _videoWidth, _videoHeight) {
    if (!this.enabled || !predictions || predictions.length === 0) {
      return;
    }

    predictions.forEach((pred) => {
      // Get center point of bounding box
      const [x, y, width, height] = pred.bbox;
      const centerX = x + width / 2;
      const centerY = y + height / 2;

      // Convert to grid coordinates
      const gridX = Math.floor(centerX / this.config.gridSize);
      const gridY = Math.floor(centerY / this.config.gridSize);
      const key = `${gridX},${gridY}`;

      // Increment heat value at this grid cell
      const currentValue = this.heatData.get(key) || 0;
      const newValue = currentValue + 1;
      this.heatData.set(key, newValue);

      // Track maximum value for normalization
      if (newValue > this.maxValue) {
        this.maxValue = newValue;
      }
    });
  }

  /**
   * Add a single point to heat map (for movement tracking)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} weight - Heat weight (default 1)
   */
  addPoint(x, y, weight = 1) {
    if (!this.enabled) {
      return;
    }

    const gridX = Math.floor(x / this.config.gridSize);
    const gridY = Math.floor(y / this.config.gridSize);
    const key = `${gridX},${gridY}`;

    const currentValue = this.heatData.get(key) || 0;
    const newValue = currentValue + weight;
    this.heatData.set(key, newValue);

    if (newValue > this.maxValue) {
      this.maxValue = newValue;
    }
  }

  /**
   * Render the heat map on the canvas
   */
  render() {
    if (!this.enabled || this.heatData.size === 0) {
      return;
    }

    // Clear off-screen canvas
    this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);

    // Draw heat points with radial gradients (smooth blending)
    this.heatData.forEach((value, key) => {
      const [gridX, gridY] = key.split(',').map(Number);
      const x = (gridX + 0.5) * this.config.gridSize;
      const y = (gridY + 0.5) * this.config.gridSize;

      // Normalize intensity (0-1)
      const normalizedValue = Math.min(value / this.config.maxIntensity, 1);
      const intensity = normalizedValue * this.config.intensity;

      // Create smooth radial gradient with multiple color stops
      const gradient = this.offscreenCtx.createRadialGradient(x, y, 0, x, y, this.config.radius);

      // Smooth gradient for better visual appeal
      gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
      gradient.addColorStop(0.4, `rgba(255, 255, 255, ${intensity * 0.8})`);
      gradient.addColorStop(0.7, `rgba(255, 255, 255, ${intensity * 0.4})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      // Use lighter compositing for smooth blending
      this.offscreenCtx.globalCompositeOperation = 'lighter';
      this.offscreenCtx.fillStyle = gradient;
      this.offscreenCtx.fillRect(
        x - this.config.radius,
        y - this.config.radius,
        this.config.radius * 2,
        this.config.radius * 2
      );
    });

    // Reset composite operation
    this.offscreenCtx.globalCompositeOperation = 'source-over';

    // Apply color mapping
    this.applyColorMap();

    // Clear main canvas before drawing
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply blur for smoother appearance
    this.ctx.save();
    this.ctx.filter = `blur(${this.config.blur}px)`;
    this.ctx.globalAlpha = this.config.opacity;
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    this.ctx.restore();

    // Reset filter
    this.ctx.filter = 'none';
  }

  /**
   * Apply color mapping to heat map
   */
  applyColorMap() {
    const imageData = this.offscreenCtx.getImageData(
      0,
      0,
      this.offscreenCanvas.width,
      this.offscreenCanvas.height
    );
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const intensity = data[i]; // Using red channel as intensity

      if (intensity > 0) {
        const color = this.getColorForIntensity(intensity / 255);
        data[i] = color.r;
        data[i + 1] = color.g;
        data[i + 2] = color.b;
        data[i + 3] = color.a;
      }
    }

    this.offscreenCtx.putImageData(imageData, 0, 0);
  }

  /**
   * Get color for given intensity value
   * @param {number} intensity - Normalized intensity (0-1)
   * @returns {Object} RGBA color object
   */
  getColorForIntensity(intensity) {
    switch (this.config.colorScheme) {
      case 'hot':
        return this.getHotColor(intensity);
      case 'cool':
        return this.getCoolColor(intensity);
      case 'rainbow':
        return this.getRainbowColor(intensity);
      default:
        return this.getHotColor(intensity);
    }
  }

  /**
   * Hot color scheme (blue -> cyan -> green -> yellow -> red)
   * @param {number} t - Intensity (0-1)
   * @returns {Object} RGBA color
   */
  getHotColor(t) {
    const alpha = Math.floor(t * 255);

    if (t < 0.25) {
      return { r: 0, g: 0, b: Math.floor(t * 4 * 255), a: alpha };
    } else if (t < 0.5) {
      return { r: 0, g: Math.floor((t - 0.25) * 4 * 255), b: 255, a: alpha };
    } else if (t < 0.75) {
      return {
        r: Math.floor((t - 0.5) * 4 * 255),
        g: 255,
        b: Math.floor((1 - (t - 0.5) * 4) * 255),
        a: alpha
      };
    } else {
      return { r: 255, g: Math.floor((1 - (t - 0.75) * 4) * 255), b: 0, a: alpha };
    }
  }

  /**
   * Cool color scheme (blue -> purple -> pink -> white)
   * @param {number} t - Intensity (0-1)
   * @returns {Object} RGBA color
   */
  getCoolColor(t) {
    const alpha = Math.floor(t * 255);
    const r = Math.floor(t * 255);
    const g = Math.floor(t * t * 200);
    const b = 255;
    return { r, g, b, a: alpha };
  }

  /**
   * Rainbow color scheme
   * @param {number} t - Intensity (0-1)
   * @returns {Object} RGBA color
   */
  getRainbowColor(t) {
    const alpha = Math.floor(t * 255);
    const hue = t * 300; // 0-300 degrees (blue to red)
    const rgb = this.hslToRgb(hue / 360, 1, 0.5);
    return { r: rgb.r, g: rgb.g, b: rgb.b, a: alpha };
  }

  /**
   * Convert HSL to RGB
   * @param {number} h - Hue (0-1)
   * @param {number} s - Saturation (0-1)
   * @param {number} l - Lightness (0-1)
   * @returns {Object} RGB color
   */
  hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) {
          t += 1;
        }
        if (t > 1) {
          t -= 1;
        }
        if (t < 1 / 6) {
          return p + (q - p) * 6 * t;
        }
        if (t < 1 / 2) {
          return q;
        }
        if (t < 2 / 3) {
          return p + (q - p) * (2 / 3 - t) * 6;
        }
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  /**
   * Clear all heat map data
   */
  clear() {
    this.heatData.clear();
    this.maxValue = 0;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    console.log('[HeatMap] Cleared');
  }

  /**
   * Enable heat map tracking and visualization
   */
  enable() {
    this.enabled = true;
    console.log('[HeatMap] Enabled');
  }

  /**
   * Disable heat map tracking and visualization
   */
  disable() {
    this.enabled = false;
    console.log('[HeatMap] Disabled');
  }

  /**
   * Toggle heat map on/off
   * @returns {boolean} New enabled state
   */
  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    console.log('[HeatMap] Toggled', this.enabled);
    return this.enabled;
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration values
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('[HeatMap] Config updated', newConfig);
  }

  /**
   * Set intensity multiplier
   * @param {number} intensity - Intensity value (0-2)
   */
  setIntensity(intensity) {
    this.config.intensity = Math.max(0, Math.min(2, intensity));
  }

  /**
   * Set opacity
   * @param {number} opacity - Opacity value (0-1)
   */
  setOpacity(opacity) {
    this.config.opacity = Math.max(0, Math.min(1, opacity));
  }

  /**
   * Set color scheme
   * @param {string} scheme - Color scheme name (hot, cool, rainbow)
   */
  setColorScheme(scheme) {
    if (['hot', 'cool', 'rainbow'].includes(scheme)) {
      this.config.colorScheme = scheme;
    }
  }

  /**
   * Export heat map as image
   * @returns {string} Data URL of heat map image
   */
  exportImage() {
    // Create a temporary canvas with heat map only
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.canvas.width;
    exportCanvas.height = this.canvas.height;
    const exportCtx = exportCanvas.getContext('2d');

    // Draw heat map
    exportCtx.drawImage(this.offscreenCanvas, 0, 0);

    return exportCanvas.toDataURL('image/png');
  }

  /**
   * Download heat map as PNG
   * @param {string} filename - Filename for download
   */
  downloadImage(filename = 'heatmap.png') {
    const dataUrl = this.exportImage();
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
    console.log('[HeatMap] Downloaded as', filename);
  }

  /**
   * Get heat map statistics
   * @returns {Object} Statistics about the heat map
   */
  getStats() {
    const totalPoints = this.heatData.size;
    let totalIntensity = 0;
    const hotspots = [];

    this.heatData.forEach((value, key) => {
      totalIntensity += value;
      const [gridX, gridY] = key.split(',').map(Number);
      hotspots.push({
        x: (gridX + 0.5) * this.config.gridSize,
        y: (gridY + 0.5) * this.config.gridSize,
        intensity: value
      });
    });

    // Sort hotspots by intensity
    hotspots.sort((a, b) => b.intensity - a.intensity);

    return {
      totalPoints,
      totalIntensity,
      maxIntensity: this.maxValue,
      averageIntensity: totalPoints > 0 ? totalIntensity / totalPoints : 0,
      topHotspots: hotspots.slice(0, 10)
    };
  }

  /**
   * Export heat map data as JSON
   * @returns {string} JSON string of heat map data
   */
  exportData() {
    const data = {
      config: this.config,
      maxValue: this.maxValue,
      heatData: Array.from(this.heatData.entries()).map(([key, value]) => {
        const [x, y] = key.split(',').map(Number);
        return { x, y, value };
      }),
      stats: this.getStats()
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import heat map data from JSON
   * @param {string} jsonData - JSON string of heat map data
   */
  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);

      this.clear();
      this.config = { ...this.config, ...data.config };
      this.maxValue = data.maxValue || 0;

      data.heatData.forEach((point) => {
        const key = `${point.x},${point.y}`;
        this.heatData.set(key, point.value);
      });

      console.log('[HeatMap] Imported data', { points: this.heatData.size });
    } catch (error) {
      console.error('[HeatMap] Import failed:', error);
      throw error;
    }
  }
}
