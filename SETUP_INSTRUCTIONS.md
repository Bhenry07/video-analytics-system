# 🚀 Setup Instructions - Video Analytics System

## Quick Start Guide

This document will help you set up and run the Video Analytics System on your development machine.

---

## 📋 Prerequisites

Before you begin, ensure you have:

### Required Software

- **Node.js** (v14.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Modern web browser** (Chrome recommended, Firefox or Edge also work)
- **Text Editor/IDE** (VS Code, Sublime, Atom, etc.)

### System Requirements

- **OS**: Windows 10/11, macOS, or Linux
- **RAM**: Minimum 4GB (8GB+ recommended for better performance)
- **Storage**: At least 1GB free space
- **Internet**: Required for initial model download

### Check Your Node.js Version

```bash
node --version
# Should output v14.0.0 or higher

npm --version
# Should output 6.0.0 or higher
```

---

## 📂 Project Location

The project is located at:

```
H:\Coding_Projects\video-analytics-system
```

---

## 🔧 Installation Steps

### Step 1: Open Terminal/Command Prompt

**Windows**:

- Press `Win + R`
- Type `cmd` or `powershell`
- Press Enter

**macOS/Linux**:

- Open Terminal application

### Step 2: Navigate to Project Directory

```bash
cd H:\Coding_Projects\video-analytics-system
```

### Step 3: Verify Files Exist

Check that all necessary files are present:

```bash
# Windows (PowerShell)
Get-ChildItem

# macOS/Linux
ls -la
```

You should see:

- `server.js`
- `package.json`
- `public/` directory
- `node_modules/` directory
- `README.md`
- `AI_PROJECT_CONTEXT.md`
- `AI_DEVELOPMENT_PROMPT.md`

### Step 4: Install Dependencies (if needed)

If `node_modules/` folder doesn't exist or you get dependency errors:

```bash
npm install
```

This will install:

- `express` - Web server framework
- `multer` - File upload handling
- `@tensorflow/tfjs` - TensorFlow.js library
- `@tensorflow-models/coco-ssd` - Object detection model
- `video.js` - Video player
- `chart.js` - Charting library

Installation may take 1-2 minutes depending on your internet speed.

---

## ▶️ Running the Application

### Start the Server

```bash
npm start
```

Or directly with Node:

```bash
node server.js
```

You should see:

```
🎥 Video Analytics Server Running!

📡 Access the app at: http://localhost:3000

📁 Uploads directory: H:\Coding_Projects\video-analytics-system\uploads
```

### Access the Application

1. Open your web browser (Chrome recommended)
2. Navigate to: **http://localhost:3000**
3. You should see the Video Analytics dashboard

### Initial Load Time

**First time opening the app**:

- The AI model will download (may take 10-30 seconds)
- You'll see "Loading AI Model..." status
- Once loaded, status will show "Model Ready ✓"

---

## 🎮 Using the Application

### 1. Upload a Video

1. Click the **"Choose File"** button in the Upload Video section
2. Select a video file from your computer (MP4, AVI, MOV, MKV, or WebM)
3. Click **"Upload"**
4. Wait for upload to complete (progress bar will show status)
5. Video will automatically load in the player

### 2. Configure Detection Settings

Before starting analysis, configure:

- **👤 Detect People** - Enable/disable person detection
- **🚗 Detect Vehicles** - Enable/disable vehicle detection (cars, trucks, etc.)
- **📦 Detect Objects** - Enable/disable other object detection
- **Confidence Threshold** - Adjust from 0-100% (higher = fewer false positives)
- **Detection FPS** - Adjust from 1-30 FPS (higher = more detections but slower)

**Recommended Settings for First Use**:

- All checkboxes enabled
- Confidence: 50%
- Detection FPS: 5

### 3. Start Analysis

1. Click the **"▶ Start Analysis"** button
2. Video will start playing with real-time detection
3. Watch for:
   - **Green boxes** = People detected
   - **Red boxes** = Vehicles detected
   - **Orange boxes** = Other objects detected
4. Monitor the statistics dashboard for counts and charts

### 4. Review Results

- **Stats Cards** - Show current counts (people, vehicles, total objects, FPS)
- **Timeline Chart** - Visual representation of detections over time
- **Detection Log** - Scrollable list of timestamped detections

### 5. Export Data

1. Click **"💾 Export Data"** button
2. A JSON file will download with all detection results
3. File name format: `video-analytics-[timestamp].json`

### 6. Manage Videos

- **Select Video** - Click on any video in the "Recent Videos" list
- **Delete Video** - Click the 🗑️ button next to a video name
- **Upload New** - Upload as many videos as you want (managed separately)

---

## 🛑 Stopping the Application

### Stop the Server

In the terminal where the server is running:

- Press `Ctrl + C`
- Confirm if prompted
- Server will shut down

### Close Browser Tab

Simply close the browser tab or window.

---

## 🐛 Troubleshooting

### Issue: Port 3000 Already in Use

**Error Message**: `EADDRINUSE: address already in use :::3000`

**Solution**:

1. Stop any other application using port 3000
2. Or change the port in `server.js`:
   ```javascript
   const PORT = 3001; // Change from 3000
   ```

### Issue: Model Not Loading

**Symptom**: Status stuck on "Loading AI Model..."

**Solutions**:

1. Check internet connection (model downloads from CDN)
2. Clear browser cache: `Ctrl + Shift + Delete`
3. Try different browser (Chrome recommended)
4. Check browser console for errors: `F12` → Console tab
5. Disable browser extensions that might block scripts

### Issue: Video Won't Upload

**Symptoms**: Upload fails or shows error

**Solutions**:

1. Check file size (max 500MB by default)
2. Verify file format (MP4, AVI, MOV, MKV, WebM)
3. Ensure you have disk space available
4. Check file isn't corrupted (try playing it in media player first)
5. Try smaller video file first to test

### Issue: Video Plays But No Detections

**Symptoms**: Bounding boxes don't appear

**Solutions**:

1. Verify model status shows "Model Ready ✓"
2. Check that at least one detection type is enabled
3. Try lowering confidence threshold (to 30%)
4. Ensure video is actually playing (not paused)
5. Check browser console for errors
6. Try different video with clear objects

### Issue: Slow Performance / Lag

**Symptoms**: Low FPS, choppy playback

**Solutions**:

1. Lower Detection FPS to 2-3
2. Increase confidence threshold to 60-70%
3. Disable unused detection types
4. Close other browser tabs and applications
5. Use smaller video files (lower resolution)
6. Ensure hardware acceleration enabled in browser:
   - Chrome: `chrome://settings/` → Advanced → System → "Use hardware acceleration"

### Issue: Bounding Boxes in Wrong Position

**Symptoms**: Boxes don't align with objects

**Solutions**:

1. Refresh the page and reload video
2. Ensure video metadata loaded (wait for video to fully load)
3. Try different video file
4. Check browser zoom level is 100%
5. Resize browser window to reset canvas

### Issue: Browser Console Shows Errors

**Common Errors and Fixes**:

**Error**: `Cannot find module '@tensorflow/tfjs'`

- Run: `npm install`

**Error**: `Uncaught ReferenceError: cocoSsd is not defined`

- Check `index.html` includes TensorFlow.js scripts
- Verify internet connection for CDN

**Error**: `Failed to fetch`

- Check server is running on port 3000
- Verify URL is `http://localhost:3000`

**Error**: `WebGL not supported`

- Update graphics drivers
- Use Chrome/Firefox (better WebGL support)
- Safari has limited support

---

## 🔍 Verifying Installation

### Quick Test Checklist

- [ ] Server starts without errors
- [ ] Can access `http://localhost:3000` in browser
- [ ] UI loads correctly (no layout issues)
- [ ] Model status shows "Model Ready ✓"
- [ ] Can upload a test video
- [ ] Video appears in "Recent Videos" list
- [ ] Video plays in player
- [ ] Can click "Start Analysis"
- [ ] Detections appear (boxes on video)
- [ ] Statistics update in real-time
- [ ] Chart displays data
- [ ] Can export JSON data
- [ ] Can delete video

If all items pass ✓, installation is successful!

---

## 📁 Project Structure Overview

```
video-analytics-system/
│
├── server.js                      # Backend server (Express)
├── package.json                   # Project dependencies
├── package-lock.json              # Locked dependency versions
│
├── public/                        # Frontend files (served to browser)
│   ├── index.html                # Main UI
│   ├── app.js                    # Application logic
│   └── styles.css                # Styling
│
├── uploads/                       # Uploaded videos (auto-created)
│   └── (your video files)
│
├── node_modules/                  # Installed dependencies (git-ignored)
│   └── (many packages)
│
├── README.md                      # User documentation
├── AI_PROJECT_CONTEXT.md          # Project context for AI
├── AI_DEVELOPMENT_PROMPT.md       # AI development guide
├── SETUP_INSTRUCTIONS.md          # This file
└── .gitignore                     # Git ignore rules
```

---

## 🎓 Next Steps

### For Users

1. **Test with sample videos** - Start with short videos (< 1 minute)
2. **Experiment with settings** - Try different FPS and confidence levels
3. **Review exported data** - Open JSON files to understand data structure
4. **Upload various content** - Test with different types of videos

### For Developers

1. **Read** `AI_PROJECT_CONTEXT.md` - Understand architecture
2. **Review** `AI_DEVELOPMENT_PROMPT.md` - Learn development guidelines
3. **Explore** `server.js` - Study API endpoints
4. **Study** `public/app.js` - Understand VideoAnalytics class
5. **Experiment** - Make small changes and test

---

## 🌐 Browser Compatibility

### Recommended

- ✅ **Google Chrome** (v90+) - Best performance
- ✅ **Mozilla Firefox** (v88+) - Good performance
- ✅ **Microsoft Edge** (v90+) - Good performance

### Limited Support

- ⚠️ **Safari** (v14+) - Limited WebGL support, slower performance

### Not Supported

- ❌ Internet Explorer (any version)
- ❌ Older browser versions

---

## 💾 Storage Considerations

### Uploaded Videos

- Stored in: `H:\Coding_Projects\video-analytics-system\uploads\`
- **Not deleted automatically** - manage manually
- Each video retains original filename with timestamp prefix

### Disk Space Management

To free up space:

1. Delete videos through the UI (🗑️ button)
2. Or manually delete from `uploads/` folder
3. Or change upload directory in `server.js`

---

## 🔐 Security Notes

### Current Setup (Development)

⚠️ **This is a development setup with NO security features**:

- No authentication (anyone can access)
- No HTTPS (data not encrypted)
- No file validation beyond type/size
- No rate limiting
- Local network only (not exposed to internet)

### For Production Use

If deploying to production, implement:

- [ ] User authentication (JWT/OAuth)
- [ ] HTTPS/SSL certificates
- [ ] File scanning for malware
- [ ] Rate limiting on uploads
- [ ] Database for persistence
- [ ] Environment variables for config
- [ ] Logging and monitoring
- [ ] Input validation and sanitization

**DO NOT expose this development setup to the public internet!**

---

## 📞 Getting Help

### Resources

1. **README.md** - User guide and features
2. **AI_PROJECT_CONTEXT.md** - Technical details and architecture
3. **AI_DEVELOPMENT_PROMPT.md** - Development guidelines
4. **Browser Console** - Check for errors (`F12` → Console)

### Common Commands Reference

```bash
# Start server
npm start

# Install dependencies
npm install

# Check Node version
node --version

# Check npm version
npm --version

# View package info
npm list

# Clean install (if issues)
rm -rf node_modules package-lock.json
npm install
```

---

## ✅ Success Indicators

You're successfully set up when:

- ✓ Server starts and shows startup message
- ✓ Browser loads the dashboard UI
- ✓ AI model loads (status shows "Ready")
- ✓ Can upload and play videos
- ✓ Detections appear on video
- ✓ Can export data as JSON

---

**You're all set! Start analyzing videos with AI-powered detection.** 🎉

---

_Last Updated: 2025-11-06_
