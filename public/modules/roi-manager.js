/**
 * ROI (Region of Interest) Manager Module
 * Handles drawing, managing, and filtering detections by zones
 */

class ROIManager {
  /**
   * Initialize ROI Manager
   * @param {HTMLCanvasElement} canvas - Canvas element for drawing
   * @param {Object} callbacks - Callback functions
   * @param {Function} callbacks.onZonesChanged - Called when zones are modified
   */
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks;

    // Drawing state
    this.isDrawing = false;
    this.drawingMode = false; // Toggle drawing mode on/off
    this.currentShape = null;
    this.startPoint = null;

    // Zones storage
    this.zones = []; // Array of {id, name, type, points, color, enabled}
    this.selectedZone = null;
    this.hoveredZone = null;

    // Shape types
    this.shapeType = 'rectangle'; // 'rectangle' or 'polygon'

    // Load zones from localStorage
    this.loadZones();

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup canvas event listeners for drawing
   */
  setupEventListeners() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('click', this.handleClick.bind(this));
  }

  /**
   * Enable or disable drawing mode
   * @param {boolean} enabled - Drawing mode state
   */
  setDrawingMode(enabled) {
    this.drawingMode = enabled;
    this.canvas.style.cursor = enabled ? 'crosshair' : 'default';

    // Toggle drawing-mode class to enable/disable pointer events
    if (enabled) {
      this.canvas.classList.add('drawing-mode');
    } else {
      this.canvas.classList.remove('drawing-mode');
    }

    if (!enabled) {
      // Cancel any ongoing drawing
      this.isDrawing = false;
      this.currentShape = null;
      this.startPoint = null;
    }
  }

  /**
   * Set shape type for drawing
   * @param {string} type - 'rectangle' or 'polygon'
   */
  setShapeType(type) {
    this.shapeType = type;
  }

  /**
   * Handle mouse down event
   * @param {MouseEvent} e - Mouse event
   */
  handleMouseDown(e) {
    if (!this.drawingMode) {
      return;
    }

    const point = this.getCanvasPoint(e);

    if (this.shapeType === 'rectangle') {
      this.isDrawing = true;
      this.startPoint = point;
      this.currentShape = {
        type: 'rectangle',
        points: [point, point] // Start and end point
      };
    }
  }

  /**
   * Handle mouse move event
   * @param {MouseEvent} e - Mouse event
   */
  handleMouseMove(e) {
    const point = this.getCanvasPoint(e);

    if (this.drawingMode && this.isDrawing && this.shapeType === 'rectangle') {
      // Update current rectangle end point
      this.currentShape.points[1] = point;
      this.redraw();
    } else if (!this.drawingMode) {
      // Check for hover over existing zones
      this.hoveredZone = this.findZoneAtPoint(point);
      this.redraw();
    }
  }

  /**
   * Handle mouse up event
   * @param {MouseEvent} e - Mouse event
   */
  handleMouseUp(e) {
    if (!this.drawingMode || !this.isDrawing) {
      return;
    }

    if (this.shapeType === 'rectangle') {
      const point = this.getCanvasPoint(e);
      this.currentShape.points[1] = point;

      // Only save if rectangle has minimum size
      const width = Math.abs(this.currentShape.points[1].x - this.currentShape.points[0].x);
      const height = Math.abs(this.currentShape.points[1].y - this.currentShape.points[0].y);

      if (width > 10 && height > 10) {
        this.saveCurrentShape();
      }

      this.isDrawing = false;
      this.currentShape = null;
      this.startPoint = null;
    }
  }

  /**
   * Handle click event (for polygon drawing)
   * @param {MouseEvent} e - Mouse event
   */
  handleClick(e) {
    if (!this.drawingMode || this.shapeType !== 'polygon') {
      return;
    }

    const point = this.getCanvasPoint(e);

    if (!this.currentShape) {
      // Start new polygon
      this.currentShape = {
        type: 'polygon',
        points: [point]
      };
    } else {
      // Add point to polygon
      this.currentShape.points.push(point);
    }

    this.redraw();
  }

  /**
   * Complete polygon drawing (called externally)
   */
  completePolygon() {
    if (
      this.currentShape &&
      this.currentShape.type === 'polygon' &&
      this.currentShape.points.length >= 3
    ) {
      this.saveCurrentShape();
      this.currentShape = null;
    }
  }

  /**
   * Save current shape as a zone
   */
  saveCurrentShape() {
    if (!this.currentShape) {
      return;
    }

    const zone = {
      id: this.generateZoneId(),
      name: `Zone ${this.zones.length + 1}`,
      type: this.currentShape.type,
      points: this.currentShape.points.map((p) => ({ x: p.x, y: p.y })),
      color: this.generateColor(),
      enabled: true,
      created: Date.now()
    };

    this.zones.push(zone);
    this.saveZones();
    this.redraw();

    if (this.callbacks.onZonesChanged) {
      this.callbacks.onZonesChanged(this.zones);
    }
  }

  /**
   * Get canvas coordinates from mouse event
   * @param {MouseEvent} e - Mouse event
   * @returns {Object} {x, y} coordinates
   */
  getCanvasPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  /**
   * Generate unique zone ID
   * @returns {string} Unique ID
   */
  generateZoneId() {
    return `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate random color for zone
   * @returns {string} RGB color string
   */
  generateColor() {
    const colors = [
      'rgba(255, 99, 132, 0.5)', // Red
      'rgba(54, 162, 235, 0.5)', // Blue
      'rgba(255, 206, 86, 0.5)', // Yellow
      'rgba(75, 192, 192, 0.5)', // Green
      'rgba(153, 102, 255, 0.5)', // Purple
      'rgba(255, 159, 64, 0.5)' // Orange
    ];
    return colors[this.zones.length % colors.length];
  }

  /**
   * Redraw all zones and current drawing
   */
  redraw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw all existing zones
    this.zones.forEach((zone) => {
      if (zone.enabled) {
        const isHovered = this.hoveredZone && this.hoveredZone.id === zone.id;
        const isSelected = this.selectedZone && this.selectedZone.id === zone.id;
        this.drawZone(zone, isSelected, isHovered);
      }
    });

    // Draw current shape being drawn
    if (this.currentShape) {
      this.drawCurrentShape();
    }
  }

  /**
   * Draw a zone
   * @param {Object} zone - Zone object
   * @param {boolean} isSelected - Is zone selected
   * @param {boolean} isHovered - Is zone hovered
   */
  drawZone(zone, isSelected = false, isHovered = false) {
    this.ctx.save();

    // Set style
    this.ctx.strokeStyle = isSelected ? '#ff0000' : isHovered ? '#00ff00' : zone.color;
    this.ctx.lineWidth = isSelected ? 3 : isHovered ? 2 : 2;
    this.ctx.fillStyle = zone.color;

    if (zone.type === 'rectangle') {
      const [p1, p2] = zone.points;
      const x = Math.min(p1.x, p2.x);
      const y = Math.min(p1.y, p2.y);
      const width = Math.abs(p2.x - p1.x);
      const height = Math.abs(p2.y - p1.y);

      this.ctx.fillRect(x, y, width, height);
      this.ctx.strokeRect(x, y, width, height);

      // Draw zone name
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '14px Arial';
      this.ctx.fillText(zone.name, x + 5, y + 20);
    } else if (zone.type === 'polygon') {
      this.ctx.beginPath();
      this.ctx.moveTo(zone.points[0].x, zone.points[0].y);
      zone.points.forEach((point, i) => {
        if (i > 0) {
          this.ctx.lineTo(point.x, point.y);
        }
      });
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();

      // Draw zone name
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '14px Arial';
      this.ctx.fillText(zone.name, zone.points[0].x + 5, zone.points[0].y + 20);
    }

    this.ctx.restore();
  }

  /**
   * Draw current shape being drawn
   */
  drawCurrentShape() {
    if (!this.currentShape) {
      return;
    }

    this.ctx.save();
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);

    if (this.currentShape.type === 'rectangle') {
      const [p1, p2] = this.currentShape.points;
      const x = Math.min(p1.x, p2.x);
      const y = Math.min(p1.y, p2.y);
      const width = Math.abs(p2.x - p1.x);
      const height = Math.abs(p2.y - p1.y);
      this.ctx.strokeRect(x, y, width, height);
    } else if (this.currentShape.type === 'polygon') {
      this.ctx.beginPath();
      this.ctx.moveTo(this.currentShape.points[0].x, this.currentShape.points[0].y);
      this.currentShape.points.forEach((point, i) => {
        if (i > 0) {
          this.ctx.lineTo(point.x, point.y);
        }
      });
      this.ctx.stroke();

      // Draw points
      this.currentShape.points.forEach((point) => {
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(point.x - 3, point.y - 3, 6, 6);
      });
    }

    this.ctx.restore();
  }

  /**
   * Find zone at given point
   * @param {Object} point - {x, y} coordinates
   * @returns {Object|null} Zone object or null
   */
  findZoneAtPoint(point) {
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const zone = this.zones[i];
      if (!zone.enabled) {
        continue;
      }

      if (zone.type === 'rectangle') {
        const [p1, p2] = zone.points;
        const x = Math.min(p1.x, p2.x);
        const y = Math.min(p1.y, p2.y);
        const width = Math.abs(p2.x - p1.x);
        const height = Math.abs(p2.y - p1.y);

        if (point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height) {
          return zone;
        }
      } else if (zone.type === 'polygon') {
        if (this.isPointInPolygon(point, zone.points)) {
          return zone;
        }
      }
    }
    return null;
  }

  /**
   * Check if point is inside polygon using ray casting
   * @param {Object} point - {x, y} coordinates
   * @param {Array} polygon - Array of points
   * @returns {boolean} True if inside
   */
  isPointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x,
        yi = polygon[i].y;
      const xj = polygon[j].x,
        yj = polygon[j].y;

      const intersect =
        yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) {
        inside = !inside;
      }
    }
    return inside;
  }

  /**
   * Check if a detection bounding box intersects with any enabled zone
   * @param {Object} bbox - Bounding box {x, y, width, height} in normalized coords (0-1)
   * @param {number} videoWidth - Video width in pixels
   * @param {number} videoHeight - Video height in pixels
   * @returns {Array} Array of zone IDs that intersect
   */
  getIntersectingZones(bbox, videoWidth, videoHeight) {
    if (this.zones.length === 0) {
      return ['all']; // No zones defined, return all detections
    }

    const intersectingZones = [];

    // Convert normalized bbox to canvas coordinates
    const canvasX = bbox.x * videoWidth;
    const canvasY = bbox.y * videoHeight;
    const canvasWidth = bbox.width * videoWidth;
    const canvasHeight = bbox.height * videoHeight;

    // Check center point of bounding box
    const centerX = canvasX + canvasWidth / 2;
    const centerY = canvasY + canvasHeight / 2;

    this.zones.forEach((zone) => {
      if (!zone.enabled) {
        return;
      }

      let intersects = false;

      if (zone.type === 'rectangle') {
        const [p1, p2] = zone.points;
        const zoneX = Math.min(p1.x, p2.x);
        const zoneY = Math.min(p1.y, p2.y);
        const zoneWidth = Math.abs(p2.x - p1.x);
        const zoneHeight = Math.abs(p2.y - p1.y);

        // Check if center point is inside zone
        if (
          centerX >= zoneX &&
          centerX <= zoneX + zoneWidth &&
          centerY >= zoneY &&
          centerY <= zoneY + zoneHeight
        ) {
          intersects = true;
        }
      } else if (zone.type === 'polygon') {
        // Check if center point is inside polygon
        if (this.isPointInPolygon({ x: centerX, y: centerY }, zone.points)) {
          intersects = true;
        }
      }

      if (intersects) {
        intersectingZones.push(zone.id);
      }
    });

    return intersectingZones.length > 0 ? intersectingZones : [];
  }

  /**
   * Delete a zone by ID
   * @param {string} zoneId - Zone ID
   */
  deleteZone(zoneId) {
    this.zones = this.zones.filter((z) => z.id !== zoneId);
    this.saveZones();
    this.redraw();

    if (this.callbacks.onZonesChanged) {
      this.callbacks.onZonesChanged(this.zones);
    }
  }

  /**
   * Toggle zone enabled state
   * @param {string} zoneId - Zone ID
   */
  toggleZone(zoneId) {
    const zone = this.zones.find((z) => z.id === zoneId);
    if (zone) {
      zone.enabled = !zone.enabled;
      this.saveZones();
      this.redraw();

      if (this.callbacks.onZonesChanged) {
        this.callbacks.onZonesChanged(this.zones);
      }
    }
  }

  /**
   * Rename a zone
   * @param {string} zoneId - Zone ID
   * @param {string} newName - New name
   */
  renameZone(zoneId, newName) {
    const zone = this.zones.find((z) => z.id === zoneId);
    if (zone) {
      zone.name = newName;
      this.saveZones();
      this.redraw();
    }
  }

  /**
   * Clear all zones
   */
  clearAllZones() {
    this.zones = [];
    this.saveZones();
    this.redraw();

    if (this.callbacks.onZonesChanged) {
      this.callbacks.onZonesChanged(this.zones);
    }
  }

  /**
   * Get all zones
   * @returns {Array} Array of zones
   */
  getAllZones() {
    return this.zones;
  }

  /**
   * Get enabled zones only
   * @returns {Array} Array of enabled zones
   */
  getEnabledZones() {
    return this.zones.filter((z) => z.enabled);
  }

  /**
   * Save zones to localStorage
   */
  saveZones() {
    try {
      localStorage.setItem('videoAnalytics_zones', JSON.stringify(this.zones));
    } catch (error) {
      console.error('Failed to save zones:', error);
    }
  }

  /**
   * Load zones from localStorage
   */
  loadZones() {
    try {
      const saved = localStorage.getItem('videoAnalytics_zones');
      if (saved) {
        this.zones = JSON.parse(saved);
        this.redraw();
      }
    } catch (error) {
      console.error('Failed to load zones:', error);
      this.zones = [];
    }
  }

  /**
   * Export zones as JSON
   * @returns {string} JSON string of zones
   */
  exportZones() {
    return JSON.stringify(this.zones, null, 2);
  }

  /**
   * Import zones from JSON
   * @param {string} jsonString - JSON string
   */
  importZones(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      if (Array.isArray(imported)) {
        this.zones = imported;
        this.saveZones();
        this.redraw();

        if (this.callbacks.onZonesChanged) {
          this.callbacks.onZonesChanged(this.zones);
        }
      }
    } catch (error) {
      console.error('Failed to import zones:', error);
      throw new Error('Invalid zone data');
    }
  }

  /**
   * Update canvas size (call when video size changes)
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  updateCanvasSize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.redraw();
  }

  /**
   * Cleanup and remove event listeners
   */
  destroy() {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('click', this.handleClick);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ROIManager;
}
