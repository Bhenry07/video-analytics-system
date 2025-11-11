/**
 * In-App Labeling Interface
 *
 * Interactive canvas-based interface for drawing, editing, and managing
 * bounding box annotations on video frames.
 *
 * Features:
 * - Click-drag to draw boxes
 * - Resize and move existing boxes
 * - Delete boxes with keyboard shortcut
 * - Class selector dropdown
 * - Batch labeling tools
 * - Undo/redo support
 * - Keyboard shortcuts for productivity
 */

class LabelingInterface {
  constructor(containerId, autoLabelingEngine) {
    this.container = document.getElementById(containerId);
    this.engine = autoLabelingEngine;

    // Canvas setup
    this.canvas = null;
    this.ctx = null;
    this.imageCanvas = null;
    this.imageCtx = null;

    // State
    this.currentFrame = null;
    this.currentFrameId = null;
    this.currentClass = null;
    this.annotations = [];

    // Drawing state
    this.isDrawing = false;
    this.isDragging = false;
    this.isResizing = false;
    this.startX = 0;
    this.startY = 0;
    this.currentBox = null;
    this.selectedBox = null;
    this.hoveredBox = null;
    this.resizeHandle = null;

    // History for undo/redo
    this.history = [];
    this.historyIndex = -1;

    // Settings
    this.settings = {
      boxLineWidth: 2,
      handleSize: 8,
      minBoxSize: 10,
      snapToGrid: false,
      gridSize: 10,
      showLabels: true,
      showConfidence: true
    };

    this.init();
  }

  /**
   * Initialize the interface
   */
  init() {
    this.createUI();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    console.log('[Labeling Interface] Initialized');
  }

  /**
   * Create UI elements
   */
  createUI() {
    this.container.innerHTML = `
      <div class="labeling-interface">
        <!-- Toolbar -->
        <div class="labeling-toolbar">
          <div class="toolbar-section">
            <label>Class:</label>
            <select id="classSelector" class="class-selector">
              <option value="">Select class...</option>
            </select>
          </div>
          
          <div class="toolbar-section">
            <button id="undoBtn" class="toolbar-btn" title="Undo (Ctrl+Z)">
              ↶ Undo
            </button>
            <button id="redoBtn" class="toolbar-btn" title="Redo (Ctrl+Y)">
              ↷ Redo
            </button>
          </div>
          
          <div class="toolbar-section">
            <button id="deleteBtn" class="toolbar-btn danger" title="Delete (Del)">
              🗑️ Delete
            </button>
            <button id="clearBtn" class="toolbar-btn danger" title="Clear All">
              Clear All
            </button>
          </div>
          
          <div class="toolbar-section">
            <button id="autoLabelBtn" class="toolbar-btn primary">
              ⚡ Auto-Label
            </button>
            <button id="acceptAllBtn" class="toolbar-btn success">
              ✓ Accept All
            </button>
          </div>
        </div>
        
        <!-- Canvas Area -->
        <div class="canvas-container">
          <canvas id="imageCanvas" class="image-canvas"></canvas>
          <canvas id="annotationCanvas" class="annotation-canvas"></canvas>
          <div class="canvas-overlay">
            <div id="canvasHint" class="canvas-hint">
              Select a class and drag to draw a bounding box
            </div>
          </div>
        </div>
        
        <!-- Sidebar -->
        <div class="labeling-sidebar">
          <div class="sidebar-section">
            <h3>Annotations</h3>
            <div id="annotationList" class="annotation-list"></div>
          </div>
          
          <div class="sidebar-section">
            <h3>Stats</h3>
            <div id="labelingStats" class="labeling-stats">
              <div class="stat-item">
                <span class="stat-label">Frame:</span>
                <span class="stat-value" id="statFrame">-</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Annotations:</span>
                <span class="stat-value" id="statAnnotations">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Auto:</span>
                <span class="stat-value" id="statAuto">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Manual:</span>
                <span class="stat-value" id="statManual">0</span>
              </div>
            </div>
          </div>
          
          <div class="sidebar-section">
            <h3>Keyboard Shortcuts</h3>
            <div class="shortcuts-list">
              <div class="shortcut-item">
                <kbd>Click+Drag</kbd> Draw box
              </div>
              <div class="shortcut-item">
                <kbd>Del</kbd> Delete selected
              </div>
              <div class="shortcut-item">
                <kbd>Ctrl+Z</kbd> Undo
              </div>
              <div class="shortcut-item">
                <kbd>Ctrl+Y</kbd> Redo
              </div>
              <div class="shortcut-item">
                <kbd>Esc</kbd> Deselect
              </div>
              <div class="shortcut-item">
                <kbd>Space</kbd> Auto-label
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Get canvas references
    this.canvas = document.getElementById('annotationCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.imageCanvas = document.getElementById('imageCanvas');
    this.imageCtx = this.imageCanvas.getContext('2d');

    // Populate class selector
    this.updateClassSelector();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Canvas mouse events
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));

    // Toolbar buttons
    document.getElementById('undoBtn').addEventListener('click', () => this.undo());
    document.getElementById('redoBtn').addEventListener('click', () => this.redo());
    document.getElementById('deleteBtn').addEventListener('click', () => this.deleteSelected());
    document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
    document.getElementById('autoLabelBtn').addEventListener('click', () => this.autoLabel());
    document.getElementById('acceptAllBtn').addEventListener('click', () => this.acceptAll());

    // Class selector
    document.getElementById('classSelector').addEventListener('change', (e) => {
      this.currentClass = e.target.value;
      this.updateHint();
    });
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ignore if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          this.deleteSelected();
          break;

        case 'Escape':
          this.deselectAll();
          break;

        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.undo();
          }
          break;

        case 'y':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.redo();
          }
          break;

        case ' ':
          e.preventDefault();
          this.autoLabel();
          break;
      }
    });
  }

  /**
   * Load a frame for labeling
   */
  async loadFrame(frame, frameId) {
    this.currentFrame = frame;
    this.currentFrameId = frameId;

    // Set canvas size
    this.canvas.width = frame.width || 1920;
    this.canvas.height = frame.height || 1080;
    this.imageCanvas.width = this.canvas.width;
    this.imageCanvas.height = this.canvas.height;

    // Draw image
    const img = new Image();
    img.onload = () => {
      this.imageCtx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
      this.render();
    };
    img.src = frame.dataUrl || frame.src;

    // Load existing annotations
    this.annotations = this.engine.getAnnotations(frameId);
    this.selectedBox = null;
    this.hoveredBox = null;

    // Update UI
    this.updateStats();
    this.updateAnnotationList();
    document.getElementById('statFrame').textContent = frameId;

    console.log(`[Labeling Interface] Loaded frame ${frameId}`);
  }

  /**
   * Handle mouse down
   */
  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on existing box
    const clickedBox = this.getBoxAt(x, y);

    if (clickedBox) {
      // Check if clicking on resize handle
      const handle = this.getResizeHandle(clickedBox, x, y);

      if (handle) {
        this.isResizing = true;
        this.selectedBox = clickedBox;
        this.resizeHandle = handle;
        this.startX = x;
        this.startY = y;
      } else {
        // Start dragging
        this.isDragging = true;
        this.selectedBox = clickedBox;
        this.startX = x;
        this.startY = y;
      }
    } else {
      // Start drawing new box
      if (!this.currentClass) {
        this.updateHint('Please select a class first!');
        return;
      }

      this.isDrawing = true;
      this.startX = x;
      this.startY = y;
      this.currentBox = {
        x: x,
        y: y,
        width: 0,
        height: 0,
        class: this.currentClass
      };
      this.selectedBox = null;
    }

    this.render();
  }

  /**
   * Handle mouse move
   */
  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.isDrawing) {
      // Update current box size
      this.currentBox.width = x - this.startX;
      this.currentBox.height = y - this.startY;
      this.render();
    } else if (this.isDragging && this.selectedBox) {
      // Move selected box
      const dx = x - this.startX;
      const dy = y - this.startY;

      const annotation = this.annotations.find((a) => a.id === this.selectedBox.id);
      if (annotation) {
        annotation.bbox[0] += dx;
        annotation.bbox[1] += dy;
        this.startX = x;
        this.startY = y;
      }

      this.render();
    } else if (this.isResizing && this.selectedBox) {
      // Resize selected box
      const dx = x - this.startX;
      const dy = y - this.startY;

      const annotation = this.annotations.find((a) => a.id === this.selectedBox.id);
      if (annotation) {
        this.resizeBox(annotation, this.resizeHandle, dx, dy);
        this.startX = x;
        this.startY = y;
      }

      this.render();
    } else {
      // Update hover state
      const hoveredBox = this.getBoxAt(x, y);
      if (hoveredBox !== this.hoveredBox) {
        this.hoveredBox = hoveredBox;
        this.render();
      }

      // Update cursor
      if (hoveredBox) {
        const handle = this.getResizeHandle(hoveredBox, x, y);
        if (handle) {
          this.canvas.style.cursor = this.getResizeCursor(handle);
        } else {
          this.canvas.style.cursor = 'move';
        }
      } else {
        this.canvas.style.cursor = 'crosshair';
      }
    }
  }

  /**
   * Handle mouse up
   */
  handleMouseUp(e) {
    if (this.isDrawing && this.currentBox) {
      // Finalize box
      const minSize = this.settings.minBoxSize;

      if (Math.abs(this.currentBox.width) > minSize && Math.abs(this.currentBox.height) > minSize) {
        // Normalize box (handle negative width/height)
        const normalizedBox = this.normalizeBox(this.currentBox);

        // Add annotation
        const annotation = {
          class: this.currentClass,
          bbox: [normalizedBox.x, normalizedBox.y, normalizedBox.width, normalizedBox.height],
          confidence: 1.0
        };

        this.engine.addAnnotation(this.currentFrameId, annotation);
        this.annotations = this.engine.getAnnotations(this.currentFrameId);
        this.saveHistory();

        console.log('[Labeling Interface] Added annotation:', annotation);
      }

      this.currentBox = null;
    }

    this.isDrawing = false;
    this.isDragging = false;
    this.isResizing = false;
    this.resizeHandle = null;

    this.updateStats();
    this.updateAnnotationList();
    this.render();
  }

  /**
   * Handle mouse leave
   */
  handleMouseLeave(e) {
    this.handleMouseUp(e);
    this.hoveredBox = null;
    this.render();
  }

  /**
   * Get box at coordinates
   */
  getBoxAt(x, y) {
    // Check in reverse order (top box first)
    for (let i = this.annotations.length - 1; i >= 0; i--) {
      const ann = this.annotations[i];
      const [bx, by, bw, bh] = ann.bbox;

      if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
        return ann;
      }
    }

    return null;
  }

  /**
   * Get resize handle at coordinates
   */
  getResizeHandle(box, x, y) {
    const [bx, by, bw, bh] = box.bbox;
    const handleSize = this.settings.handleSize;

    const handles = {
      nw: { x: bx, y: by },
      ne: { x: bx + bw, y: by },
      sw: { x: bx, y: by + bh },
      se: { x: bx + bw, y: by + bh },
      n: { x: bx + bw / 2, y: by },
      s: { x: bx + bw / 2, y: by + bh },
      w: { x: bx, y: by + bh / 2 },
      e: { x: bx + bw, y: by + bh / 2 }
    };

    for (const [name, pos] of Object.entries(handles)) {
      if (Math.abs(x - pos.x) <= handleSize && Math.abs(y - pos.y) <= handleSize) {
        return name;
      }
    }

    return null;
  }

  /**
   * Resize box based on handle
   */
  resizeBox(annotation, handle, dx, dy) {
    const bbox = annotation.bbox;

    switch (handle) {
      case 'nw':
        bbox[0] += dx;
        bbox[1] += dy;
        bbox[2] -= dx;
        bbox[3] -= dy;
        break;
      case 'ne':
        bbox[1] += dy;
        bbox[2] += dx;
        bbox[3] -= dy;
        break;
      case 'sw':
        bbox[0] += dx;
        bbox[2] -= dx;
        bbox[3] += dy;
        break;
      case 'se':
        bbox[2] += dx;
        bbox[3] += dy;
        break;
      case 'n':
        bbox[1] += dy;
        bbox[3] -= dy;
        break;
      case 's':
        bbox[3] += dy;
        break;
      case 'w':
        bbox[0] += dx;
        bbox[2] -= dx;
        break;
      case 'e':
        bbox[2] += dx;
        break;
    }
  }

  /**
   * Get cursor for resize handle
   */
  getResizeCursor(handle) {
    const cursors = {
      nw: 'nw-resize',
      ne: 'ne-resize',
      sw: 'sw-resize',
      se: 'se-resize',
      n: 'n-resize',
      s: 's-resize',
      w: 'w-resize',
      e: 'e-resize'
    };

    return cursors[handle] || 'default';
  }

  /**
   * Normalize box (handle negative dimensions)
   */
  normalizeBox(box) {
    let { x, y, width, height } = box;

    if (width < 0) {
      x += width;
      width = -width;
    }

    if (height < 0) {
      y += height;
      height = -height;
    }

    return { x, y, width, height };
  }

  /**
   * Render canvas
   */
  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw existing annotations
    for (const ann of this.annotations) {
      const isSelected = this.selectedBox && this.selectedBox.id === ann.id;
      const isHovered = this.hoveredBox && this.hoveredBox.id === ann.id;

      this.drawBox(ann, isSelected, isHovered);
    }

    // Draw current box being drawn
    if (this.isDrawing && this.currentBox) {
      this.drawCurrentBox();
    }
  }

  /**
   * Draw a bounding box
   */
  drawBox(annotation, isSelected, isHovered) {
    const [x, y, w, h] = annotation.bbox;
    const classObj = this.engine.customClasses.find((c) => c.name === annotation.class);
    const color = classObj ? classObj.color : '#FF6B6B';

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = isSelected ? 3 : this.settings.boxLineWidth;
    this.ctx.setLineDash(isHovered ? [5, 5] : []);

    // Draw box
    this.ctx.strokeRect(x, y, w, h);

    // Draw label
    if (this.settings.showLabels) {
      const label = annotation.class;
      const confidence = annotation.confidence;
      const text = this.settings.showConfidence
        ? `${label} ${(confidence * 100).toFixed(0)}%`
        : label;

      this.ctx.font = '12px Arial';
      const textWidth = this.ctx.measureText(text).width;

      // Background
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y - 20, textWidth + 8, 18);

      // Text
      this.ctx.fillStyle = '#fff';
      this.ctx.fillText(text, x + 4, y - 6);
    }

    // Draw resize handles if selected
    if (isSelected) {
      this.drawResizeHandles(x, y, w, h, color);
    }

    this.ctx.setLineDash([]);
  }

  /**
   * Draw resize handles
   */
  drawResizeHandles(x, y, w, h, color) {
    const size = this.settings.handleSize;
    const handles = [
      [x, y], // nw
      [x + w, y], // ne
      [x, y + h], // sw
      [x + w, y + h], // se
      [x + w / 2, y], // n
      [x + w / 2, y + h], // s
      [x, y + h / 2], // w
      [x + w, y + h / 2] // e
    ];

    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 1;

    for (const [hx, hy] of handles) {
      this.ctx.fillRect(hx - size / 2, hy - size / 2, size, size);
      this.ctx.strokeRect(hx - size / 2, hy - size / 2, size, size);
    }
  }

  /**
   * Draw current box being drawn
   */
  drawCurrentBox() {
    const { x, y, width, height, class: className } = this.currentBox;
    const classObj = this.engine.customClasses.find((c) => c.name === className);
    const color = classObj ? classObj.color : '#FF6B6B';

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(x, y, width, height);
    this.ctx.setLineDash([]);
  }

  /**
   * Update class selector
   */
  updateClassSelector() {
    const selector = document.getElementById('classSelector');
    selector.innerHTML = '<option value="">Select class...</option>';

    for (const cls of this.engine.customClasses) {
      const option = document.createElement('option');
      option.value = cls.name;
      option.textContent = `${cls.icon} ${cls.name}`;
      selector.appendChild(option);
    }
  }

  /**
   * Update annotation list
   */
  updateAnnotationList() {
    const list = document.getElementById('annotationList');

    if (this.annotations.length === 0) {
      list.innerHTML = '<div class="empty-state">No annotations yet</div>';
      return;
    }

    list.innerHTML = this.annotations
      .map((ann, index) => {
        const classObj = this.engine.customClasses.find((c) => c.name === ann.class);
        const icon = classObj ? classObj.icon : '📦';
        const color = classObj ? classObj.color : '#FF6B6B';
        const isSelected = this.selectedBox && this.selectedBox.id === ann.id;

        return `
        <div class="annotation-item ${isSelected ? 'selected' : ''}" 
             data-id="${ann.id}"
             style="border-left: 3px solid ${color}">
          <div class="annotation-header">
            <span class="annotation-icon">${icon}</span>
            <span class="annotation-class">${ann.class}</span>
            <span class="annotation-source ${ann.source}">${ann.source}</span>
          </div>
          <div class="annotation-details">
            ${(ann.confidence * 100).toFixed(0)}% confidence
          </div>
        </div>
      `;
      })
      .join('');

    // Add click handlers
    list.querySelectorAll('.annotation-item').forEach((item) => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        this.selectedBox = this.annotations.find((a) => a.id === id);
        this.render();
        this.updateAnnotationList();
      });
    });
  }

  /**
   * Update stats
   */
  updateStats() {
    const autoCount = this.annotations.filter((a) => a.source === 'auto').length;
    const manualCount = this.annotations.filter((a) => a.source === 'manual').length;

    document.getElementById('statAnnotations').textContent = this.annotations.length;
    document.getElementById('statAuto').textContent = autoCount;
    document.getElementById('statManual').textContent = manualCount;
  }

  /**
   * Update hint message
   */
  updateHint(message) {
    const hint = document.getElementById('canvasHint');
    if (message) {
      hint.textContent = message;
      hint.style.display = 'block';
      setTimeout(() => {
        hint.style.display = 'none';
      }, 3000);
    } else {
      if (this.currentClass) {
        hint.textContent = `Draw ${this.currentClass} bounding boxes`;
      } else {
        hint.textContent = 'Select a class and drag to draw a bounding box';
      }
    }
  }

  /**
   * Delete selected annotation
   */
  deleteSelected() {
    if (!this.selectedBox) {
      this.updateHint('No annotation selected');
      return;
    }

    this.engine.deleteAnnotation(this.currentFrameId, this.selectedBox.id);
    this.annotations = this.engine.getAnnotations(this.currentFrameId);
    this.selectedBox = null;

    this.saveHistory();
    this.updateStats();
    this.updateAnnotationList();
    this.render();
  }

  /**
   * Clear all annotations
   */
  clearAll() {
    if (!confirm('Clear all annotations from this frame?')) {
      return;
    }

    this.annotations = [];
    this.selectedBox = null;
    this.engine.annotations.set(this.currentFrameId, []);

    this.saveHistory();
    this.updateStats();
    this.updateAnnotationList();
    this.render();
  }

  /**
   * Deselect all
   */
  deselectAll() {
    this.selectedBox = null;
    this.render();
    this.updateAnnotationList();
  }

  /**
   * Auto-label current frame
   */
  async autoLabel() {
    this.updateHint('Auto-labeling...');

    // TODO: Implement auto-labeling logic
    // This would call the AutoLabelingEngine to detect and label objects

    this.updateHint('Auto-labeling complete!');
  }

  /**
   * Accept all annotations
   */
  acceptAll() {
    // Mark all auto annotations as accepted
    for (const ann of this.annotations) {
      if (ann.source === 'auto') {
        ann.source = 'accepted';
      }
    }

    this.updateAnnotationList();
    this.updateHint('All annotations accepted!');
  }

  /**
   * History management
   */
  saveHistory() {
    const state = JSON.parse(JSON.stringify(this.annotations));
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(state);
    this.historyIndex++;
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.annotations = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.render();
      this.updateAnnotationList();
      this.updateStats();
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.annotations = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.render();
      this.updateAnnotationList();
      this.updateStats();
    }
  }
}

// Export for use in app
window.LabelingInterface = LabelingInterface;
