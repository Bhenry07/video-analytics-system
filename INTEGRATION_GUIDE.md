# 🔧 Quick Integration Guide

## How to Add Auto-Labeling to Your App

### 1. Add Script Tags to index.html

Add these **BEFORE** `app-refactored.js`:

```html
<!-- Add after frame-extractor.js -->
<script src="modules/auto-labeling-engine.js"></script>
<script src="modules/labeling-interface.js"></script>
```

### 2. Add UI Section to index.html

Add this section after your frame extraction section:

```html
<!-- Auto-Labeling & Training Section -->
<section id="labelingSection" class="section" style="display: none;">
  <div class="section-header">
    <h2>🎯 Label Training Data</h2>
    <p>Auto-label frames and refine annotations for model training</p>
  </div>
  
  <!-- Class Setup -->
  <div class="class-setup-card">
    <h3>📋 Your Banking Classes</h3>
    <div id="classesDisplay" class="classes-display">
      <div class="class-badge">👔 bank-teller</div>
      <div class="class-badge">🏦 teller-station</div>
      <div class="class-badge">🧑‍💼 customer-at-teller</div>
      <div class="class-badge">💳 customer-at-atm</div>
      <div class="class-badge">🏧 atm-machine</div>
    </div>
    <button id="setupClassesBtn" class="btn">⚙️ Edit Classes</button>
  </div>
  
  <!-- Auto-Label Controls -->
  <div class="auto-label-controls">
    <button id="autoLabelAllBtn" class="btn btn-primary">
      ⚡ Auto-Label All Frames
    </button>
    <button id="reviewLabelsBtn" class="btn">
      👀 Review Labels
    </button>
    <button id="exportDatasetBtn" class="btn btn-success">
      📦 Export Dataset
    </button>
  </div>
  
  <!-- Progress -->
  <div id="autoLabelProgress" class="progress-container" style="display: none;">
    <div class="progress-bar">
      <div id="autoLabelProgressBar" class="progress-fill"></div>
    </div>
    <p id="autoLabelStatus">Processing...</p>
  </div>
  
  <!-- Stats -->
  <div id="autoLabelStats" class="stats-grid" style="display: none;">
    <div class="stat-card">
      <div class="stat-label">Total Frames</div>
      <div class="stat-value" id="statTotalFrames">0</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Labeled Frames</div>
      <div class="stat-value" id="statLabeledFrames">0</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Auto Labels</div>
      <div class="stat-value" id="statAutoLabels">0</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Manual Labels</div>
      <div class="stat-value" id="statManualLabels">0</div>
    </div>
  </div>
  
  <!-- Labeling Interface -->
  <div id="labelingInterface" style="display: none;"></div>
</section>
```

### 3. Add Methods to app-refactored.js

Add these methods to your `VideoAnalyticsApp` class:

```javascript
class VideoAnalyticsApp {
  constructor() {
    // ... existing code ...
    this.autoLabeler = null;
    this.labelingUI = null;
  }
  
  init() {
    // ... existing init code ...
    this.setupAutoLabeling();
  }
  
  setupAutoLabeling() {
    // Initialize auto-labeling engine
    this.autoLabeler = new AutoLabelingEngine(this.detectionEngine);
    
    // Define banking classes
    this.autoLabeler.defineCustomClasses([
      {
        name: 'bank-teller',
        color: '#FF6B6B',
        icon: '👔',
        description: 'Bank employee behind counter'
      },
      {
        name: 'teller-station',
        color: '#4ECDC4',
        icon: '🏦',
        description: 'Teller counter/window area'
      },
      {
        name: 'customer-at-teller',
        color: '#45B7D1',
        icon: '🧑‍💼',
        description: 'Customer interacting with teller'
      },
      {
        name: 'customer-at-atm',
        color: '#FFA07A',
        icon: '💳',
        description: 'Person within 2ft of ATM'
      },
      {
        name: 'atm-machine',
        color: '#98D8C8',
        icon: '🏧',
        description: 'ATM hardware'
      }
    ]);
    
    // Add mapping rules
    // Note: You'll need to manually label ATMs first, or use a pre-trained ATM detector
    this.autoLabeler.addMappingRule({
      source: 'person',
      target: 'customer-at-atm',
      condition: 'near',
      reference: 'atm-machine',
      distance: 60, // About 2 feet at 1920x1080
      minConfidence: 0.6
    });
    
    // Initialize labeling UI
    this.labelingUI = new LabelingInterface('labelingInterface', this.autoLabeler);
    
    // Setup event listeners
    document.getElementById('autoLabelAllBtn')?.addEventListener('click', () => {
      this.autoLabelAllFrames();
    });
    
    document.getElementById('reviewLabelsBtn')?.addEventListener('click', () => {
      this.reviewLabels();
    });
    
    document.getElementById('exportDatasetBtn')?.addEventListener('click', () => {
      this.exportDataset();
    });
    
    console.log('[App] Auto-labeling system initialized');
  }
  
  async autoLabelAllFrames() {
    if (!this.frameExtractor || !this.frameExtractor.frames || 
        this.frameExtractor.frames.length === 0) {
      alert('Please extract frames first!');
      return;
    }
    
    const frames = this.frameExtractor.frames;
    const progressBar = document.getElementById('autoLabelProgressBar');
    const statusText = document.getElementById('autoLabelStatus');
    const progressContainer = document.getElementById('autoLabelProgress');
    
    // Show progress
    progressContainer.style.display = 'block';
    document.getElementById('labelingSection').style.display = 'block';
    
    // Run auto-labeling
    const result = await this.autoLabeler.batchAutoLabel(
      frames,
      (processed, total, frameResult) => {
        const percent = (processed / total) * 100;
        progressBar.style.width = percent + '%';
        statusText.textContent = 
          `Processing frame ${processed}/${total} - Found ${frameResult.count} objects`;
      }
    );
    
    // Update stats
    this.updateAutoLabelStats();
    
    // Hide progress
    setTimeout(() => {
      progressContainer.style.display = 'none';
      alert(`Auto-labeling complete!\n\nLabeled ${result.labeled} frames with ${this.autoLabeler.stats.totalAnnotations} objects.`);
    }, 500);
  }
  
  updateAutoLabelStats() {
    const stats = this.autoLabeler.getStats();
    
    document.getElementById('statTotalFrames').textContent = stats.totalFrames;
    document.getElementById('statLabeledFrames').textContent = stats.labeledFrames;
    document.getElementById('statAutoLabels').textContent = stats.autoLabeled;
    document.getElementById('statManualLabels').textContent = stats.manualLabeled;
    document.getElementById('autoLabelStats').style.display = 'grid';
  }
  
  reviewLabels() {
    if (!this.frameExtractor || !this.frameExtractor.frames || 
        this.frameExtractor.frames.length === 0) {
      alert('No frames to review!');
      return;
    }
    
    // Show labeling interface
    document.getElementById('labelingInterface').style.display = 'block';
    
    // Load first frame
    const firstFrame = this.frameExtractor.frames[0];
    this.labelingUI.loadFrame(firstFrame, 'frame_0001');
    
    alert('Use the labeling interface to review and edit annotations.\n\n' +
          'Shortcuts:\n' +
          '- Click+Drag: Draw box\n' +
          '- Del: Delete selected\n' +
          '- Ctrl+Z: Undo\n' +
          '- Space: Auto-label current frame');
  }
  
  exportDataset() {
    if (this.autoLabeler.stats.totalAnnotations === 0) {
      alert('No annotations to export! Label some frames first.');
      return;
    }
    
    // Export to Roboflow format
    const roboflowData = this.autoLabeler.exportToRoboflow();
    
    // Download JSON
    const blob = new Blob([JSON.stringify(roboflowData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'banking_dataset_roboflow.json';
    a.click();
    
    // Also export YOLO format
    const yoloData = this.autoLabeler.exportToYOLO();
    console.log('[Export] YOLO format:', yoloData);
    
    // Show success
    alert(`Dataset exported!\n\n` +
          `Frames: ${this.autoLabeler.stats.totalFrames}\n` +
          `Annotations: ${this.autoLabeler.stats.totalAnnotations}\n\n` +
          `Download the JSON and upload to Roboflow!`);
  }
}
```

### 4. Update extractFrames() to Show Labeling Section

In your existing `extractFrames()` method, add this at the end:

```javascript
async extractFrames() {
  // ... existing extraction code ...
  
  // After successful extraction, show labeling section
  document.getElementById('labelingSection').style.display = 'block';
  document.getElementById('labelingSection').scrollIntoView({ behavior: 'smooth' });
}
```

### 5. Test It!

1. **Refresh your browser** (Ctrl+Shift+R)
2. **Load a video** 
3. **Extract frames** (you already know how!)
4. **Click "⚡ Auto-Label All Frames"**
5. **Click "👀 Review Labels"** to see the labeling interface
6. **Click "📦 Export Dataset"** when done

---

## 🎯 What Happens Next?

1. System detects all "person" objects in frames
2. Applies your mapping rules (if ATMs are detected)
3. Shows you stats (X frames labeled, Y objects found)
4. You review/correct in labeling interface
5. Export to Roboflow format
6. Upload to Roboflow and train!

---

## ⚠️ Important Notes

### ATM Detection Challenge

COCO-SSD doesn't have "atm" class, so the auto-labeling for "customer-at-atm" won't work automatically. **Two solutions:**

**Solution 1: Manual ATM labeling first**
1. Use the labeling interface to manually draw boxes around all ATMs
2. Label them as "atm-machine"
3. THEN run auto-labeling
4. The system will detect people near ATMs

**Solution 2: Start simple**
1. Auto-label all "person" objects first (no spatial rules)
2. Manually assign them to correct classes (teller vs customer)
3. Manually add ATM boxes
4. Export and train

**Solution 3: Two-stage approach** (recommended)
1. Stage 1: Train ATM-only model (100 images, 1 class, 1 hour)
2. Deploy ATM model to app
3. Stage 2: Use ATM model to detect ATMs
4. Use COCO-SSD to detect people
5. Apply spatial rules → auto-label everything!

---

## 🚀 Ready to Build?

Want me to integrate all of this into your actual `index.html` and `app-refactored.js` right now? Just say the word and I'll add it! 🎉
