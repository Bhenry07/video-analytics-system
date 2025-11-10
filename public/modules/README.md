# 📦 Modules Documentation

This directory contains the modularized components of the Video Analytics System. Each module handles a specific aspect of the application.

## 📚 Module Overview

### 1. ErrorHandler (`error-handler.js`)

**Purpose**: Centralized error handling, logging, and user notifications

**Key Features**:

- User-friendly error messages
- Toast notification system
- Error logging to localStorage
- Input validation helpers

**Usage Example**:

```javascript
try {
  // Some operation
} catch (error) {
  ErrorHandler.handle(error, 'Operation Name');
}

// Show success message
ErrorHandler.showSuccess('Operation completed!');

// Validate input
ErrorHandler.validate(
  value,
  {
    required: true,
    type: 'number',
    min: 0,
    max: 100
  },
  'Confidence Threshold'
);
```

---

### 2. DetectionEngine (`detection-engine.js`)

**Purpose**: AI model management and object detection

**Key Features**:

- COCO-SSD model loading
- Frame-by-frame object detection
- Prediction filtering by confidence and type
- Detection categorization (people, vehicles, objects)

**Usage Example**:

```javascript
const engine = new DetectionEngine({
  detectPeople: true,
  detectVehicles: true,
  confidenceThreshold: 0.5
});

await engine.loadModel();

const result = await engine.detectFrame(videoElement);
const counts = engine.countByCategory(result.predictions);
```

**API**:

- `loadModel()` - Load COCO-SSD model
- `detectFrame(videoElement)` - Detect objects in frame
- `filterPredictions(predictions)` - Apply filters
- `classifyPrediction(pred)` - Categorize prediction
- `countByCategory(predictions)` - Count by type
- `updateConfig(config)` - Update settings
- `isReady()` - Check if model loaded
- `dispose()` - Clean up resources

---

### 3. ChartManager (`chart-manager.js`)

**Purpose**: Data visualization and timeline charting

**Key Features**:

- Chart.js integration
- Real-time data updates
- Data sampling for performance
- Statistics calculation
- Export functionality

**Usage Example**:

```javascript
const chartManager = new ChartManager('timelineChart');
chartManager.setupChart();

// Add data point
chartManager.addDataPoint(timestamp, {
  people: 2,
  vehicles: 1,
  objects: 3
});

chartManager.updateChart();

// Get statistics
const stats = chartManager.getStatistics();
```

**API**:

- `setupChart()` - Initialize chart
- `addDataPoint(timestamp, counts)` - Add data
- `updateChart()` - Refresh visualization
- `clearData()` - Reset all data
- `getStatistics()` - Get summary stats
- `exportData()` - Export chart data
- `setMaxDataPoints(max)` - Set point limit
- `destroy()` - Clean up chart

---

### 4. DataExporter (`data-exporter.js`)

**Purpose**: Export analysis results in various formats

**Key Features**:

- JSON export
- CSV export
- Summary report generation
- Statistics calculation
- File download handling

**Usage Example**:

```javascript
// Export as JSON
DataExporter.exportJSON(detectionData, {
  duration: 120,
  settings: config
});

// Export as CSV
DataExporter.exportCSV(detectionData);

// Export summary report
DataExporter.exportSummaryReport(detectionData, metadata);

// Calculate statistics
const stats = DataExporter.calculateStatistics(detectionData);
```

**API**:

- `exportJSON(data, metadata, filename)` - Export JSON
- `exportCSV(data, filename)` - Export CSV
- `exportSummaryReport(data, metadata, filename)` - Text report
- `calculateStatistics(data)` - Compute stats
- `createDataURL(data, metadata)` - Create data URL

---

### 5. UIController (`ui-controller.js`)

**Purpose**: UI updates and user interaction handling

**Key Features**:

- DOM element caching
- Event listener management
- Callback system
- UI state management
- Progress tracking

**Usage Example**:

```javascript
const uiController = new UIController();
uiController.initialize();

// Register callbacks
uiController.registerCallbacks({
  onStartAnalysis: () => {
    /* handler */
  },
  onStopAnalysis: () => {
    /* handler */
  },
  onConfigChange: (config) => {
    /* handler */
  }
});

uiController.setupEventListeners();

// Update UI
uiController.updateStats({
  people: 2,
  vehicles: 1,
  total: 3,
  fps: 5
});

uiController.updateModelStatus('Model Ready', 'ready');
```

**API**:

- `initialize()` - Cache DOM elements
- `registerCallbacks(callbacks)` - Set event handlers
- `setupEventListeners()` - Attach listeners
- `updateModelStatus(status, state)` - Update model status
- `updateStats(stats)` - Update stat cards
- `updateLog(timestamp, predictions, categories)` - Add log entry
- `clearLog()` - Clear detection log
- `toggleAnalysisControls(isAnalyzing)` - Show/hide buttons
- `updateUploadProgress(percentage)` - Update progress bar
- `updateVideosList(videos)` - Populate video list

---

## 🔗 Module Dependencies

```
app-refactored.js (Main App)
    ├── ErrorHandler
    ├── DetectionEngine
    ├── ChartManager
    ├── DataExporter
    └── UIController
```

## 🚀 Integration Guide

### Loading Modules in HTML

```html
<!-- Load modules in order -->
<script src="modules/error-handler.js"></script>
<script src="modules/detection-engine.js"></script>
<script src="modules/chart-manager.js"></script>
<script src="modules/data-exporter.js"></script>
<script src="modules/ui-controller.js"></script>

<!-- Load main app -->
<script src="app-refactored.js"></script>
```

### Using in Main Application

```javascript
class VideoAnalytics {
    constructor() {
        // Initialize modules
        this.detectionEngine = new DetectionEngine(config);
        this.chartManager = new ChartManager('chartId');
        this.uiController = new UIController();

        // Setup
        this.uiController.initialize();
        this.chartManager.setupChart();
        await this.detectionEngine.loadModel();
    }

    async detectFrame() {
        try {
            const result = await this.detectionEngine.detectFrame(video);
            const counts = this.detectionEngine.countByCategory(result.predictions);

            this.uiController.updateStats(counts);
            this.chartManager.addDataPoint(timestamp, counts);
            this.chartManager.updateChart();
        } catch (error) {
            ErrorHandler.handle(error, 'Detection');
        }
    }
}
```

---

## 🎨 Styling

Toast notifications require CSS (already added to `styles.css`):

```css
.error-toast {
  /* Toast container */
}
.error-toast-content {
  /* Toast content */
}
.error-toast-error {
  /* Error style */
}
.error-toast-success {
  /* Success style */
}
.error-toast-warning {
  /* Warning style */
}
.error-toast-info {
  /* Info style */
}
```

---

## 📝 JSDoc Documentation

All modules include comprehensive JSDoc comments:

```javascript
/**
 * Description of function
 * @param {Type} paramName - Parameter description
 * @returns {Type} Return value description
 * @throws {Error} Error conditions
 */
```

Generate HTML documentation:

```bash
npm install -g jsdoc
jsdoc public/modules/*.js -d docs
```

---

## ✅ Testing

Each module can be tested independently:

```javascript
// Test DetectionEngine
describe('DetectionEngine', () => {
  test('filters predictions by confidence', () => {
    const engine = new DetectionEngine({ confidenceThreshold: 0.7 });
    const predictions = [
      { class: 'person', score: 0.8 },
      { class: 'car', score: 0.5 }
    ];
    const filtered = engine.filterPredictions(predictions);
    expect(filtered).toHaveLength(1);
  });
});
```

---

## 🔧 Extending Modules

### Adding a New Detection Type

1. Update `DetectionEngine`:

```javascript
this.animalClasses = ['dog', 'cat', 'bird'];
```

2. Update filtering logic
3. Update `classifyPrediction()` method
4. Update UI controller for new category

### Adding Export Format

1. Add method to `DataExporter`:

```javascript
static exportXML(data, metadata) {
    // XML export logic
}
```

---

## 📊 Performance Considerations

- **DetectionEngine**: Uses requestAnimationFrame for smooth detection
- **ChartManager**: Samples data points to maintain performance
- **UIController**: Caches DOM elements to avoid repeated lookups
- **ErrorHandler**: Limits stored error logs to prevent memory issues
- **DataExporter**: Handles large datasets efficiently

---

## 🐛 Common Issues

### Module Not Loaded

**Error**: `ReferenceError: ErrorHandler is not defined`
**Solution**: Ensure modules loaded in correct order in HTML

### Chart Not Updating

**Error**: Chart doesn't show data
**Solution**: Verify canvas ID matches chartManager initialization

### Toast Not Showing

**Error**: Error messages don't appear
**Solution**: Ensure toast CSS is included in styles.css

---

## 📞 Support

For issues or questions about modules:

1. Check JSDoc comments in module files
2. Review examples in this README
3. Check browser console for errors
4. Review `app-refactored.js` for integration examples

---

**Last Updated**: 2025-11-06  
**Version**: 2.0.0  
**Modules**: 5 (ErrorHandler, DetectionEngine, ChartManager, DataExporter, UIController)
