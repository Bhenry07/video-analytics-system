# 🎥 Video Analytics System - AI Development Context

## Project Overview

**Project Name**: Video Analytics System  
**Project Type**: Web Application  
**Primary Purpose**: AI-powered video analytics with real-time object detection for people, vehicles, and objects  
**Current Status**: Phase 1 Complete (Code Quality & Optimization)  
**Architecture**: Modular ES6 with comprehensive testing  
**Last Updated**: 2025-11-06

---

## 📋 Project Scope

This is a **standalone web application** designed to analyze recorded video clips using AI/machine learning for object detection and classification. The system provides:

- **Real-time video analytics** with configurable detection parameters
- **Object detection** for people, vehicles, and general objects
- **Visual overlays** with bounding boxes and confidence scores
- **Analytics dashboard** with statistics, charts, and logs
- **Data export** capabilities for integration with other systems

### Future Integration

This app is being built as a **modular component** that will be integrated into a larger application in the future. Keep the architecture clean and API-ready.

---

## 🏗️ Technical Architecture

### Stack

- **Backend**: Node.js + Express (server-side)
- **Frontend**: Vanilla JavaScript (ES6 Modules), HTML5, CSS3
- **AI/ML**: TensorFlow.js + COCO-SSD model (browser-based)
- **Video Player**: Video.js
- **Charting**: Chart.js
- **File Upload**: Multer
- **Testing**: Jest + jsdom
- **Code Quality**: ESLint + Prettier + Babel

### Architecture

**Modular Design**: The application follows a modular architecture with clear separation of concerns:

1. **ErrorHandler** - Centralized error handling with user notifications
2. **DetectionEngine** - AI model management and object detection
3. **ChartManager** - Data visualization and chart management
4. **DataExporter** - Export functionality (JSON, CSV, reports)
5. **UIController** - UI state management and user interactions
6. **VideoAnalytics** - Main application orchestrator

### Key Components

1. **Server** (`server.js`) - Express API server for video management
2. **Error Handler** (`modules/error-handler.js`) - Toast notifications, validation, error logging
3. **Detection Engine** (`modules/detection-engine.js`) - TensorFlow.js COCO-SSD integration
4. **Chart Manager** (`modules/chart-manager.js`) - Chart.js wrapper with data sampling
5. **Data Exporter** (`modules/data-exporter.js`) - Multi-format export (JSON/CSV/TXT)
6. **UI Controller** (`modules/ui-controller.js`) - DOM manipulation and event handling
7. **Main App** (`app-refactored.js`) - Application coordinator

---

## 🎯 Core Features

### ✅ Implemented

- [x] Video upload and management (500MB limit)
- [x] AI model loading (COCO-SSD)
- [x] Real-time object detection on video playback
- [x] Configurable detection settings (FPS, confidence threshold)
- [x] Detection filtering (people, vehicles, objects)
- [x] Visual bounding boxes with labels
- [x] Live statistics dashboard
- [x] Timeline chart showing detection patterns
- [x] Detection log with timestamps
- [x] JSON data export
- [x] Video deletion
- [x] Responsive UI

### 🚧 Future Enhancements

- [ ] Multi-object tracking across frames
- [ ] Motion detection and analysis
- [ ] Region of Interest (ROI) selection
- [ ] Heat maps for movement patterns
- [ ] Custom model training/fine-tuning
- [ ] Batch video processing
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] User authentication and authorization
- [ ] WebRTC for live camera feeds
- [ ] Alert/notification system
- [ ] Video annotation tools
- [ ] Advanced filters (time-based, object-based)

---

## 📁 Project Structure

```
video-analytics-system/
├── server.js                    # Express server with API routes
├── package.json                 # Node.js dependencies and scripts
├── README.md                    # User documentation
├── AI_PROJECT_CONTEXT.md        # This file (AI context)
├── AI_DEVELOPMENT_PLAN.md       # 12-phase development roadmap
├── AI_DEVELOPMENT_PROMPT.md     # AI assistant instructions
├── PHASE1_PROGRESS.md           # Phase 1 completion report
├── jest.config.js               # Jest test configuration
├── eslint.config.js             # ESLint configuration
├── .prettierrc.json             # Prettier code formatting
├── babel.config.json            # Babel transpiler config
├── .gitignore                   # Git ignore rules
│
├── public/                      # Frontend files (served statically)
│   ├── index.html               # Main UI
│   ├── styles.css               # Styling with toast notifications
│   ├── app-refactored.js        # Main application (current)
│   ├── app.js                   # Legacy monolithic version (deprecated)
│   │
│   └── modules/                 # Modular components
│       ├── error-handler.js     # Error handling & validation
│       ├── detection-engine.js  # AI detection logic
│       ├── chart-manager.js     # Chart.js integration
│       ├── data-exporter.js     # Export functionality
│       ├── ui-controller.js     # UI management
│       └── README.md            # Module API documentation
│
├── tests/                       # Test suite
│   ├── unit/                    # Unit tests for each module
│   │   ├── error-handler.test.js
│   │   ├── detection-engine.test.js
│   │   ├── chart-manager.test.js
│   │   ├── data-exporter.test.js
│   │   └── ui-controller.test.js
│   ├── integration/             # Integration tests
│   │   └── system-integration.test.js
│   ├── __mocks__/               # Mock implementations
│   │   └── styleMock.js
│   ├── setup.js                 # Global test setup
│   └── README.md                # Testing documentation
│
├── uploads/                     # Video storage (auto-created, git-ignored)
│
└── node_modules/                # Dependencies (git-ignored)
```

---

## 🔑 Key Classes and Functions

### Module Architecture

#### ErrorHandler (`modules/error-handler.js`)

Centralized error handling and validation.

**Key Methods**:

- `handle(error, context, showToUser)` - Process and display errors
- `showToast(message, type)` - Display toast notifications
- `validate(value, rules, fieldName)` - Input validation
- `logError(error, context)` - Store error logs
- `getErrorLog()` / `clearErrorLog()` - Manage error history

#### DetectionEngine (`modules/detection-engine.js`)

AI model management and object detection.

**Key Methods**:

- `loadModel()` - Load TensorFlow.js COCO-SSD model
- `detectFrame(videoElement)` - Run detection on video frame
- `filterPredictions(predictions)` - Apply confidence and class filters
- `classifyPrediction(pred)` - Categorize as person/vehicle/object
- `countByCategory(predictions)` - Get detection counts
- `setConfidenceThreshold(threshold)` - Update threshold
- `setEnabledClasses(classes)` - Set allowed object classes

#### ChartManager (`modules/chart-manager.js`)

Data visualization and Chart.js integration.

**Key Methods**:

- `setupChart()` - Initialize Chart.js instance
- `addDataPoint(timestamp, counts)` - Add detection data
- `updateChart()` - Refresh visualization
- `sampleData(data, maxPoints)` - Performance optimization
- `getStatistics()` - Calculate avg/max/total stats
- `clearData()` / `destroy()` - Cleanup

#### DataExporter (`modules/data-exporter.js`)

Export detection data in multiple formats.

**Key Methods**:

- `exportJSON(data, metadata, filename)` - Export as JSON
- `exportCSV(data, filename)` - Export as CSV
- `exportSummaryReport(data, metadata)` - Text report
- `calculateStatistics(data)` - Compute statistics

#### UIController (`modules/ui-controller.js`)

UI state management and event handling.

**Key Methods**:

- `initialize()` - Cache DOM references
- `registerCallbacks(callbacks)` - Setup event handlers
- `updateStats(stats)` - Update stat displays
- `updateLog(timestamp, predictions, categories)` - Add log entry
- `updateVideosList(videos)` - Populate video dropdown
- `showStatus(message, type)` - Display status messages
- `showUploadProgress(percent)` - Progress bar
- `toggleLoading(show, message)` - Loading overlay
- `setButtonState(buttonId, enabled)` - Enable/disable buttons

#### VideoAnalytics (`app-refactored.js`)

Main application orchestrator.

**Key Methods**:

- `init()` - Initialize all modules
- `setupVideoPlayer()` - Setup Video.js
- `startDetectionLoop()` - Begin analysis
- `stopDetectionLoop()` - Stop analysis
- `detectFrame()` - Coordinate frame detection
- `loadVideos()` - Fetch available videos
- `uploadVideo(file)` - Upload with progress tracking

### Detection Configuration

```javascript
config = {
  detectPeople: true, // Enable person detection
  detectVehicles: true, // Enable vehicle detection
  detectObjects: true, // Enable other object detection
  confidenceThreshold: 0.5, // 0-1 (50% default)
  detectionFPS: 5 // 1-30 FPS
};
```

### API Endpoints

- `POST /api/upload` - Upload video file
- `GET /api/videos` - List all uploaded videos
- `DELETE /api/videos/:filename` - Delete specific video

---

## 🎨 UI/UX Design

### Layout

- **Left Sidebar**: Upload, video list, detection settings, model status
- **Main Area**: Video player with detection overlay
- **Analytics Section**: Stats cards, timeline chart, detection log

### Color Scheme

- **People**: Green (#10b981)
- **Vehicles**: Red (#ef4444)
- **Other Objects**: Orange (#f59e0b)
- **Primary**: Purple gradient (#667eea → #764ba2)

---

## 🔧 Development Guidelines

### Code Style

- Use ES6+ JavaScript features (modules, classes, async/await)
- Keep functions focused and single-purpose
- Add JSDoc comments for all public methods
- Use semantic HTML and accessible markup
- Follow ESLint rules (enforced automatically)
- Format code with Prettier (enforced in pre-commit)
- Write unit tests for all new modules
- Maintain >70% test coverage

### Performance Considerations

- Default to 5 FPS for detection (adjustable 1-30)
- Use `requestAnimationFrame` instead of `setInterval`
- Clear canvas on each frame to prevent memory leaks
- Limit chart data points to 50 for smooth rendering
- Keep detection log to last 50 entries
- Implement data sampling in Chart Manager
- Properly dispose TensorFlow.js tensors
- Cache DOM element references in UI Controller

### Error Handling

- Use centralized ErrorHandler for all errors
- Always validate file types and sizes before upload
- Display user-friendly toast notifications
- Handle model loading failures gracefully
- Provide user feedback for all async operations
- Log errors to localStorage (max 50 entries)
- Use try-catch blocks around all async operations
- Validate inputs with ErrorHandler.validate()

---

## 🧪 Testing

### Test Suite Structure

```
tests/
├── unit/                       # Unit tests (5 modules)
│   ├── error-handler.test.js   # 11 test suites, 50+ tests
│   ├── detection-engine.test.js # 10 test suites, 45+ tests
│   ├── chart-manager.test.js   # 10 test suites, 40+ tests
│   ├── data-exporter.test.js   # 9 test suites, 35+ tests
│   └── ui-controller.test.js   # 13 test suites, 45+ tests
└── integration/
    └── system-integration.test.js # End-to-end workflows
```

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode for development
npm run test:coverage # Generate coverage report
```

### Coverage Targets

- Branches: >70%
- Functions: >70%
- Lines: >70%
- Statements: >70%

### Manual Testing Checklist

#### Functionality Tests

- [ ] Video upload (various formats)
- [ ] Video playback controls
- [ ] Detection start/stop
- [ ] Configuration changes during analysis
- [ ] Data export (JSON, CSV, report)
- [ ] Video deletion
- [ ] Model loading on slow connections
- [ ] Toast notifications
- [ ] Error handling
- [ ] Input validation

#### Browser Compatibility

- [ ] Chrome (primary)
- [ ] Firefox
- [ ] Edge
- [ ] Safari (limited WebGL support)

#### Performance Tests

- [ ] Small videos (< 50MB)
- [ ] Large videos (> 200MB)
- [ ] High FPS detection (20-30 FPS)
- [ ] Multiple videos in quick succession
- [ ] Long-running analysis (10+ minutes)
- [ ] Memory usage over time

---

## 🚀 Deployment Considerations

### Current Setup (Development)

- Runs on `localhost:3000`
- Videos stored in `uploads/` directory
- No authentication or security

### Production Requirements (Future)

- [ ] Environment variables for configuration
- [ ] HTTPS/SSL certificates
- [ ] File size and upload rate limits
- [ ] CDN for TensorFlow.js models
- [ ] Database for metadata storage
- [ ] User authentication (JWT/OAuth)
- [ ] API rate limiting
- [ ] Video storage (AWS S3, Azure Blob, etc.)
- [ ] Logging and monitoring
- [ ] Error tracking (Sentry, etc.)

---

## 🔌 Integration Roadmap

### As a Microservice

The app exposes RESTful APIs for:

- Video upload and management
- Detection configuration
- Results retrieval

### As an Embedded Component

The `VideoAnalytics` class can be:

- Imported as a module
- Initialized with any video element
- Configured programmatically
- Event-driven for reactivity

### Data Format

Detection results export format:

```json
{
  "totalFrames": 150,
  "videoDuration": 30.5,
  "detectionSettings": { "detectPeople": true, "confidenceThreshold": 0.5, ... },
  "detections": [
    {
      "timestamp": 1.2,
      "predictions": [
        { "class": "person", "score": 0.89, "bbox": [x, y, w, h] }
      ]
    }
  ]
}
```

---

## 📚 Resources and References

### Documentation

- [TensorFlow.js Docs](https://www.tensorflow.org/js)
- [COCO-SSD Model](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd)
- [Video.js Documentation](https://videojs.com/)
- [Chart.js Docs](https://www.chartjs.org/)

### Object Classes (COCO Dataset)

80+ classes including:

- **People**: person
- **Vehicles**: bicycle, car, motorcycle, airplane, bus, train, truck, boat
- **Animals**: bird, cat, dog, horse, sheep, cow, elephant, bear, zebra, giraffe
- **Indoor**: chair, couch, potted plant, bed, dining table, toilet, tv, laptop, mouse, remote, keyboard, cell phone, microwave, oven, toaster, sink, refrigerator, book, clock, vase, scissors, teddy bear, hair drier, toothbrush
- **Outdoor**: traffic light, fire hydrant, stop sign, parking meter, bench
- **Sports**: baseball bat, baseball glove, skateboard, surfboard, tennis racket, bottle, wine glass, cup, fork, knife, spoon, bowl, banana, apple, sandwich, orange, broccoli, carrot, hot dog, pizza, donut, cake
- And more...

---

## 💡 Common Development Tasks

### Adding a New Detection Category

1. Update `vehicleClasses` or create new array in `VideoAnalytics` constructor
2. Add checkbox in HTML detection settings
3. Update filter logic in `filterPredictions()`
4. Add color mapping in `drawDetections()`
5. Update chart datasets if needed

### Changing the AI Model

1. Import new TensorFlow.js model
2. Update `loadModel()` method
3. Adjust prediction format handling in `detectFrame()`
4. Update object class mappings

### Adding New API Endpoint

1. Add route in `server.js`
2. Implement handler function
3. Add error handling
4. Update API documentation
5. Create frontend fetch call if needed

### Improving Performance

1. Adjust default FPS (lower = faster)
2. Reduce canvas redraw frequency
3. Optimize chart update logic
4. Implement frame skipping
5. Use Web Workers for processing

---

## ❗ Known Issues and Limitations

### Current Limitations

- **Browser-based processing**: Limited by client hardware
- **File size**: 500MB upload limit (configurable)
- **Single video**: Can only analyze one video at a time
- **No persistence**: Detection results not saved to database
- **No tracking**: Objects not tracked across frames
- **Limited formats**: Best with MP4 (H.264 codec)

### Known Issues

- Safari has limited WebGL support
- Large videos (>500MB) may cause browser slowdown
- High FPS (>20) on lower-end devices causes lag
- Canvas overlay may not perfectly align on window resize

---

## 🎯 Success Metrics

### Performance Targets

- Model load time: < 5 seconds
- Detection latency: < 200ms per frame (at 5 FPS)
- UI responsiveness: 60 FPS rendering
- Upload speed: Limited by network, not app

### Accuracy Goals

- Minimize false positives with confidence threshold
- Accurately detect people in various poses
- Reliably detect common vehicle types
- Handle occlusion and overlapping objects

---

## 📞 Support and Maintenance

### When Making Changes

1. Test all existing features
2. Update this documentation
3. Update README.md if user-facing
4. Check browser console for errors
5. Verify performance hasn't degraded

### Debugging Tips

- Check browser console for TensorFlow.js logs
- Verify model loaded successfully (status indicator)
- Test with known-good video files
- Monitor memory usage for leaks
- Use Chrome DevTools Performance tab

---

**Remember**: This is a growing project. Keep code modular, document changes, and think about future integration needs.
