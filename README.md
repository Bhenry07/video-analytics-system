# Video Analytics App - AI-Powered Object Detection System

A standalone web application for analyzing video content using AI-powered object detection. Detects people, vehicles, and other objects in real-time with configurable analytics.

## Features

✅ **AI Object Detection**

- People detection
- Vehicle detection (cars, trucks, motorcycles, bicycles)
- General object classification (80+ object types)
- Real-time processing with adjustable FPS

✅ **Video Management**

- Upload video files (MP4, AVI, MOV, MKV, WebM)
- Manage multiple videos
- Built-in video player with controls

✅ **Analytics Dashboard**

- Live detection statistics
- Timeline charts showing detection patterns
- Real-time detection log
- Configurable confidence threshold

✅ **Export Capabilities**

- Export detection data as JSON
- Frame-by-frame detection records
- Timestamped analytics

## Technologies Used

- **Backend**: Node.js + Express
- **AI/ML**: TensorFlow.js + COCO-SSD model
- **Video Player**: Video.js
- **Charts**: Chart.js
- **Frontend**: Vanilla JavaScript (ES6 Modules), HTML5, CSS3
- **Testing**: Jest + jsdom
- **Code Quality**: ESLint + Prettier

## Installation

1. **Navigate to the project directory**:

   ```bash
   cd video-analytics-app
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Run tests** (optional):

   ```bash
   npm test
   ```

4. **Check code quality** (optional):
   ```bash
   npm run lint
   npm run format:check
   ```

## Development Scripts

```bash
npm start              # Start the server
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
npm run lint           # Check code for issues
npm run lint:fix       # Auto-fix linting issues
npm run format         # Format code with Prettier
npm run format:check   # Check code formatting
```

## Usage

1. **Start the server**:

   ```bash
   npm start
   ```

2. **Open your browser**:

   ```
   http://localhost:3000
   ```

3. **Upload a video**:
   - Click "Choose File" in the Upload Video section
   - Select a video file from your computer
   - Click "Upload"

4. **Configure detection settings**:
   - Enable/disable detection for people, vehicles, or objects
   - Adjust confidence threshold (higher = fewer false positives)
   - Adjust detection FPS (higher = more accurate but slower)

5. **Start analysis**:
   - Click "▶ Start Analysis" button
   - Watch real-time detections on the video
   - View statistics and timeline charts

6. **Export data**:
   - Click "💾 Export Data" to download detection results as JSON

## Configuration Options

### Detection Settings

- **Detect People**: Enable/disable person detection
- **Detect Vehicles**: Enable/disable vehicle detection (cars, trucks, motorcycles, bicycles)
- **Detect Objects**: Enable/disable other object detection
- **Confidence Threshold**: 0-100% (default: 50%)
- **Detection FPS**: 1-30 FPS (default: 5 FPS)

### Detected Object Classes

The COCO-SSD model can detect 80+ object classes including:

- **People**: person
- **Vehicles**: car, truck, bus, motorcycle, bicycle
- **Animals**: dog, cat, bird, horse, etc.
- **Objects**: bottle, chair, laptop, cell phone, etc.
- And many more...

## API Endpoints

- `POST /api/upload` - Upload a video file
- `GET /api/videos` - List all uploaded videos
- `DELETE /api/videos/:filename` - Delete a video

## File Structure

```
video-analytics-system/
├── server.js                    # Express server
├── package.json                 # Node.js dependencies
├── README.md                    # This file
├── jest.config.js               # Jest test configuration
├── eslint.config.js             # ESLint configuration
├── .prettierrc.json             # Prettier configuration
├── babel.config.json            # Babel configuration
├── public/                      # Frontend files
│   ├── index.html               # Main HTML page
│   ├── styles.css               # Styling
│   ├── app-refactored.js        # Main application (modular)
│   ├── app.js                   # Legacy application (deprecated)
│   └── modules/                 # Modular components
│       ├── error-handler.js     # Centralized error handling
│       ├── detection-engine.js  # AI model & detection logic
│       ├── chart-manager.js     # Data visualization
│       ├── data-exporter.js     # Export functionality
│       ├── ui-controller.js     # UI management
│       └── README.md            # Module documentation
├── tests/                       # Test suite
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   ├── setup.js                 # Test setup
│   └── README.md                # Testing documentation
├── uploads/                     # Uploaded videos (auto-created)
└── node_modules/                # Dependencies
```

## System Requirements

- Node.js 14+
- Modern web browser with WebGL support (Chrome, Firefox, Edge)
- Minimum 4GB RAM (8GB+ recommended for larger videos)
- GPU acceleration recommended for better performance

## Performance Tips

1. **Lower Detection FPS** for smoother playback on slower machines
2. **Increase Confidence Threshold** to reduce false positives
3. **Disable unused detection types** to speed up processing
4. **Use smaller video files** for faster uploads and processing

## Integration into Another App

This app is designed as a standalone module that can be easily integrated:

### As a Microservice

```javascript
// Your main app can make API calls to this service
const response = await fetch('http://localhost:3000/api/upload', {
  method: 'POST',
  body: formData
});
```

### As an Embedded Component

1. Copy the `public/` folder contents
2. Load modules in your HTML:
   ```html
   <script type="module" src="modules/error-handler.js"></script>
   <script type="module" src="modules/detection-engine.js"></script>
   <script type="module" src="modules/chart-manager.js"></script>
   <script type="module" src="modules/data-exporter.js"></script>
   <script type="module" src="modules/ui-controller.js"></script>
   <script type="module" src="app-refactored.js"></script>
   ```
3. The application initializes automatically on DOMContentLoaded

### Using Individual Modules

Each module can be used independently:

```javascript
// Error handling
import ErrorHandler from './modules/error-handler.js';
const errorHandler = new ErrorHandler();
errorHandler.handle(error, 'MyContext', true);

// Object detection
import DetectionEngine from './modules/detection-engine.js';
const engine = new DetectionEngine();
await engine.loadModel();
const result = await engine.detectFrame(videoElement);

// Data visualization
import ChartManager from './modules/chart-manager.js';
const chart = new ChartManager('myChartCanvas');
chart.setupChart();
chart.addDataPoint('10:30:00', { person: 2, vehicle: 1, object: 3 });

// Data export
import DataExporter from './modules/data-exporter.js';
const exporter = new DataExporter();
exporter.exportJSON(data, metadata, 'filename');
```

### As an npm Package

You can package this and publish to npm or use it as a local dependency:

```bash
npm link
# Then in your other project:
npm link video-analytics-app
```

## Troubleshooting

**Model not loading?**

- Check your internet connection (TensorFlow.js models download on first use)
- Clear browser cache and reload

**Video not playing?**

- Ensure video format is supported (MP4 recommended)
- Check browser console for errors

**Slow performance?**

- Reduce detection FPS
- Close other resource-intensive applications
- Use a smaller video resolution

## License

ISC

## Future Enhancements

- [ ] Multi-object tracking across frames
- [ ] Motion detection and analysis
- [ ] Region of interest (ROI) selection
- [ ] Custom model training
- [ ] Batch video processing
- [ ] Database integration for storing results
- [ ] User authentication
- [ ] WebRTC for live camera feeds

## Support

For issues or questions, please check the browser console for detailed error messages.
