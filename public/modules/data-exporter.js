/**
 * Data Exporter Module
 * Handles data export in various formats (JSON, CSV)
 * @module DataExporter
 */

class DataExporter {
  /**
   * Export detection data as JSON
   * @param {Array} detectionData - Array of detection records
   * @param {Object} metadata - Additional metadata (duration, settings, etc.)
   * @param {string} filename - Optional custom filename
   */
  static exportJSON(detectionData, metadata = {}, filename = null) {
    if (!detectionData || detectionData.length === 0) {
      throw new Error('No detection data to export');
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      totalFrames: detectionData.length,
      videoDuration: metadata.duration || 0,
      detectionSettings: metadata.settings || {},
      statistics: this.calculateStatistics(detectionData),
      detections: detectionData
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });

    const downloadFilename = filename || `video-analytics-${Date.now()}.json`;
    this.downloadFile(blob, downloadFilename);
  }

  /**
   * Export detection data as CSV
   * @param {Array} detectionData - Array of detection records
   * @param {string} filename - Optional custom filename
   */
  static exportCSV(detectionData, filename = null) {
    if (!detectionData || detectionData.length === 0) {
      throw new Error('No detection data to export');
    }

    // CSV header (added Zone Info column)
    let csv =
      'Timestamp,People,Vehicles,Animals,Sports Equipment,Furniture,Other Objects,Total Objects,Zone Info,Object Details\n';

    // CSV rows
    detectionData.forEach((record) => {
      const timestamp = record.timestamp.toFixed(2);
      const predictions = record.predictions || [];

      let people = 0;
      let vehicles = 0;
      let animals = 0;
      let sports = 0;
      let furniture = 0;
      let others = 0;
      const details = [];
      const zoneInfo = new Set();

      predictions.forEach((pred) => {
        const category = this.categorizeObject(pred.class);
        if (category === 'person') {
          people++;
        } else if (category === 'vehicle') {
          vehicles++;
        } else if (category === 'animal') {
          animals++;
        } else if (category === 'sports') {
          sports++;
        } else if (category === 'furniture') {
          furniture++;
        } else {
          others++;
        }

        details.push(`${pred.class}(${(pred.score * 100).toFixed(1)}%)`);

        // Collect zone information if available
        if (pred.zones && pred.zones.length > 0) {
          pred.zones.forEach((zone) => zoneInfo.add(zone));
        }
      });

      const total = predictions.length;
      const detailsStr = details.join('; ');
      const zoneInfoStr = zoneInfo.size > 0 ? Array.from(zoneInfo).join('; ') : 'All zones';

      csv += `${timestamp},${people},${vehicles},${animals},${sports},${furniture},${others},${total},"${zoneInfoStr}","${detailsStr}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const downloadFilename = filename || `video-analytics-${Date.now()}.csv`;
    this.downloadFile(blob, downloadFilename);
  }

  /**
   * Calculate statistics from detection data
   * @param {Array} detectionData - Array of detection records
   * @returns {Object} Statistics object
   */
  static calculateStatistics(detectionData) {
    if (!detectionData || detectionData.length === 0) {
      return {
        avgPeople: 0,
        avgVehicles: 0,
        avgAnimals: 0,
        avgSports: 0,
        avgFurniture: 0,
        avgObjects: 0,
        maxPeople: 0,
        maxVehicles: 0,
        maxAnimals: 0,
        maxSports: 0,
        maxFurniture: 0,
        maxObjects: 0,
        totalDetections: 0
      };
    }

    let totalPeople = 0;
    let totalVehicles = 0;
    let totalAnimals = 0;
    let totalSports = 0;
    let totalFurniture = 0;
    let totalOthers = 0;
    let maxPeople = 0;
    let maxVehicles = 0;
    let maxAnimals = 0;
    let maxSports = 0;
    let maxFurniture = 0;
    let maxOthers = 0;
    let totalDetections = 0;

    detectionData.forEach((record) => {
      const predictions = record.predictions || [];
      let framePeople = 0;
      let frameVehicles = 0;
      let frameAnimals = 0;
      let frameSports = 0;
      let frameFurniture = 0;
      let frameOthers = 0;

      predictions.forEach((pred) => {
        const category = this.categorizeObject(pred.class);
        if (category === 'person') {
          framePeople++;
        } else if (category === 'vehicle') {
          frameVehicles++;
        } else if (category === 'animal') {
          frameAnimals++;
        } else if (category === 'sports') {
          frameSports++;
        } else if (category === 'furniture') {
          frameFurniture++;
        } else {
          frameOthers++;
        }
        totalDetections++;
      });

      totalPeople += framePeople;
      totalVehicles += frameVehicles;
      totalAnimals += frameAnimals;
      totalSports += frameSports;
      totalFurniture += frameFurniture;
      totalOthers += frameOthers;

      maxPeople = Math.max(maxPeople, framePeople);
      maxVehicles = Math.max(maxVehicles, frameVehicles);
      maxAnimals = Math.max(maxAnimals, frameAnimals);
      maxSports = Math.max(maxSports, frameSports);
      maxFurniture = Math.max(maxFurniture, frameFurniture);
      maxOthers = Math.max(maxOthers, frameOthers);
    });

    const frameCount = detectionData.length;

    return {
      avgPeople: (totalPeople / frameCount).toFixed(2),
      avgVehicles: (totalVehicles / frameCount).toFixed(2),
      avgAnimals: (totalAnimals / frameCount).toFixed(2),
      avgSports: (totalSports / frameCount).toFixed(2),
      avgFurniture: (totalFurniture / frameCount).toFixed(2),
      avgObjects: (totalOthers / frameCount).toFixed(2),
      maxPeople: maxPeople,
      maxVehicles: maxVehicles,
      maxAnimals: maxAnimals,
      maxSports: maxSports,
      maxFurniture: maxFurniture,
      maxObjects: maxOthers,
      totalDetections: totalDetections
    };
  }

  /**
   * Categorize an object class
   * @param {string} className - Object class name
   * @returns {string} Category: 'person', 'vehicle', 'animal', 'sports', 'furniture', or 'object'
   */
  static categorizeObject(className) {
    const vehicleClasses = ['car', 'truck', 'bus', 'motorcycle', 'bicycle'];
    const animalClasses = [
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
    const sportsClasses = [
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
    const furnitureClasses = [
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

    if (className === 'person') {
      return 'person';
    } else if (vehicleClasses.includes(className)) {
      return 'vehicle';
    } else if (animalClasses.includes(className)) {
      return 'animal';
    } else if (sportsClasses.includes(className)) {
      return 'sports';
    } else if (furnitureClasses.includes(className)) {
      return 'furniture';
    }
    return 'object';
  }

  /**
   * Download a file to user's computer
   * @param {Blob} blob - File blob
   * @param {string} filename - Filename to save as
   */
  static downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Export summary report as text
   * @param {Array} detectionData - Array of detection records
   * @param {Object} metadata - Additional metadata
   * @param {string} filename - Optional custom filename
   */
  static exportSummaryReport(detectionData, metadata = {}, filename = null) {
    if (!detectionData || detectionData.length === 0) {
      throw new Error('No detection data to export');
    }

    const stats = this.calculateStatistics(detectionData);
    const duration = metadata.duration || 0;
    const settings = metadata.settings || {};

    const report = `
VIDEO ANALYTICS SUMMARY REPORT
==============================
Generated: ${new Date().toLocaleString()}

VIDEO INFORMATION
-----------------
Duration: ${this.formatDuration(duration)}
Total Frames Analyzed: ${detectionData.length}
Detection FPS: ${settings.detectionFPS || 'N/A'}

DETECTION SETTINGS
------------------
Detect People: ${settings.detectPeople ? 'Yes' : 'No'}
Detect Vehicles: ${settings.detectVehicles ? 'Yes' : 'No'}
Detect Objects: ${settings.detectObjects ? 'Yes' : 'No'}
Confidence Threshold: ${(settings.confidenceThreshold * 100).toFixed(0)}%

DETECTION STATISTICS
--------------------
Total Detections: ${stats.totalDetections}

Average per Frame:
  - People: ${stats.avgPeople}
  - Vehicles: ${stats.avgVehicles}
  - Other Objects: ${stats.avgObjects}

Maximum in Single Frame:
  - People: ${stats.maxPeople}
  - Vehicles: ${stats.maxVehicles}
  - Other Objects: ${stats.maxObjects}

DETAILED TIMELINE
-----------------
${this.generateTimeline(detectionData)}

==============================
End of Report
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const downloadFilename = filename || `video-analytics-report-${Date.now()}.txt`;
    this.downloadFile(blob, downloadFilename);
  }

  /**
   * Generate timeline section for report
   * @param {Array} detectionData - Detection data
   * @returns {string} Formatted timeline
   */
  static generateTimeline(detectionData) {
    const maxEntries = 50; // Limit timeline entries
    const step = Math.max(1, Math.floor(detectionData.length / maxEntries));

    let timeline = '';
    detectionData.forEach((record, index) => {
      if (index % step === 0) {
        const timestamp = this.formatDuration(record.timestamp);
        const predictions = record.predictions || [];

        if (predictions.length > 0) {
          const summary = {};
          predictions.forEach((pred) => {
            summary[pred.class] = (summary[pred.class] || 0) + 1;
          });

          const summaryStr = Object.entries(summary)
            .map(([cls, count]) => `${count}x ${cls}`)
            .join(', ');

          timeline += `[${timestamp}] ${summaryStr}\n`;
        }
      }
    });

    return timeline || 'No detections recorded';
  }

  /**
   * Format duration in seconds to MM:SS
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration
   */
  static formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Create shareable data URL
   * @param {Array} detectionData - Detection data
   * @param {Object} metadata - Metadata
   * @returns {string} Data URL
   */
  static createDataURL(detectionData, metadata = {}) {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalFrames: detectionData.length,
      videoDuration: metadata.duration || 0,
      detectionSettings: metadata.settings || {},
      statistics: this.calculateStatistics(detectionData),
      detections: detectionData
    };

    const dataStr = JSON.stringify(exportData);
    return `data:application/json;base64,${btoa(dataStr)}`;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataExporter;
}
