# Custom Object Detection Model Implementation Guide

## Executive Summary

To detect POS terminals, ATMs, and cash registers in your video analytics system, you have three approaches:

1. **Train a Custom Model** (Most Accurate) - 2-4 weeks
2. **Use Pre-trained Specialized Models** (Faster) - 1-2 days  
3. **Use ROI (Region of Interest) Detection** (Immediate) - Already planned in Phase 2

## Option 1: Train Custom Model for POS/ATM Detection

### Timeline: 2-4 Weeks
- Dataset collection: 3-5 days
- Labeling: 3-5 days
- Training: 1-2 days
- Integration: 2-3 days
- Testing & refinement: 1 week

### Step-by-Step Process

#### Phase 1: Dataset Collection (3-5 days)

**What you need:** 500-2000 images of POS terminals, ATMs, and cash registers

**Sources:**
1. **Your own footage**: Extract frames from your surveillance videos
   - Export 1 frame every 30 frames from videos
   - Vary lighting conditions, angles, distances
   - Include empty counters and with-person scenarios

2. **Public datasets:**
   - Google Open Images (search "cash register", "point of sale")
   - COCO Dataset (may have some retail images)
   - Kaggle datasets for retail/commerce

3. **Web scraping** (with permission):
   - Stock photo sites
   - Retail equipment websites
   - Security camera demo videos

**Image requirements:**
- Minimum 640x640 pixels
- Various angles (overhead, side, front)
- Different lighting (day, night, fluorescent)
- Mix of brands/models
- Include distractors (other electronics, furniture)

#### Phase 2: Data Labeling (3-5 days)

**Tool recommendations:**
1. **LabelImg** (Free, Desktop)
   - Download: https://github.com/heartexlabs/labelImg
   - Simple bounding box annotation
   - Exports to YOLO/PASCAL VOC format

2. **CVAT** (Free, Web-based)
   - https://cvat.org
   - More features, team collaboration
   - Cloud or self-hosted

3. **Roboflow** (Free tier available)
   - https://roboflow.com
   - Auto-labeling assistance
   - Data augmentation built-in

**Labeling process:**
```
For each image:
1. Draw bounding box around POS terminal/ATM
2. Label as "cash_register", "atm", or "pos_terminal"
3. Optional sub-classes:
   - "card_reader"
   - "receipt_printer"
   - "cash_drawer"
   - "touchscreen_terminal"
```

**Classes to create:**
- `cash_register` - Traditional cash registers
- `pos_terminal` - Modern touchscreen POS
- `atm` - ATM machines
- `card_reader` - Standalone card readers
- `pin_pad` - PIN entry devices

**Dataset split:**
- Training: 70% (700-1400 images)
- Validation: 20% (200-400 images)
- Testing: 10% (100-200 images)

#### Phase 3: Model Training (1-2 days)

**Recommended approach: YOLOv8 (Easiest to deploy to web)**

**Setup:**
```bash
# Install Ultralytics YOLOv8
pip install ultralytics

# Install TensorFlow.js converter
npm install @tensorflow/tfjs-converter
```

**Training script:**
```python
from ultralytics import YOLO

# Load pretrained YOLOv8 model
model = YOLO('yolov8n.pt')  # nano model for speed

# Train on your custom dataset
results = model.train(
    data='pos_detection.yaml',  # Your dataset config
    epochs=100,
    imgsz=640,
    batch=16,
    device='0',  # GPU ID or 'cpu'
    project='pos_detector',
    name='v1'
)

# Export to TensorFlow.js format
model.export(format='tfjs')
```

**Dataset config file (`pos_detection.yaml`):**
```yaml
path: /path/to/dataset
train: images/train
val: images/val
test: images/test

names:
  0: cash_register
  1: pos_terminal
  2: atm
  3: card_reader
  4: pin_pad
```

**Training tips:**
- Start with YOLOv8n (nano) for fast inference
- Use data augmentation (rotation, brightness, blur)
- Monitor mAP (mean Average Precision) - aim for >0.7
- Save checkpoints every 10 epochs
- Use GPU if available (100x faster)

**Hardware requirements:**
- CPU training: 8-12 hours per 100 epochs
- GPU training (RTX 3060+): 30-60 minutes per 100 epochs
- RAM: Minimum 8GB, recommended 16GB
- Storage: 5-10GB for dataset + models

#### Phase 4: Convert to TensorFlow.js (1 day)

**After training, convert YOLO to TF.js:**
```bash
# Export from YOLOv8 directly
yolo export model=pos_detector/v1/weights/best.pt format=tfjs

# Or use TensorFlow converter
tensorflowjs_converter \
    --input_format=tf_saved_model \
    --output_format=tfjs_graph_model \
    /path/to/saved_model \
    /path/to/web_model
```

**Result files:**
- `model.json` - Model architecture
- `group1-shard1of1.bin` - Model weights

**Hosting options:**
1. **Local hosting**: Place in `public/models/pos-detector/`
2. **CDN**: Upload to cloud storage (AWS S3, Google Cloud)
3. **GitHub**: Host in repository (if <100MB)

#### Phase 5: Integration (2-3 days)

**Add TensorFlow.js to your HTML:**
```html
<!-- In public/index.html -->
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>
<script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd"></script>
```

**Load custom model in detection engine:**
```javascript
// In detection-engine.js
async loadCustomPOSModel() {
  console.log('Loading custom POS detection model...');
  
  this.posModel = await tf.loadGraphModel('models/pos-detector/model.json');
  
  console.log('POS model loaded');
  return true;
}

async detectPOS(videoElement) {
  // Preprocess
  const tensor = tf.tidy(() => {
    let img = tf.browser.fromPixels(videoElement);
    img = tf.image.resizeBilinear(img, [640, 640]);
    img = img.div(255.0).expandDims(0);
    return img;
  });
  
  // Inference
  const predictions = await this.posModel.predict(tensor);
  
  // Post-process
  const results = this.processPOSPredictions(predictions);
  
  tensor.dispose();
  return results;
}
```

**Merge with existing detections:**
```javascript
async detectAll(video) {
  // Run both models
  const cocoResults = await this.model.detect(video);
  const posResults = await this.detectPOS(video);
  
  // Merge results
  return [...cocoResults, ...posResults];
}
```

#### Phase 6: Testing & Optimization (1 week)

**Performance metrics to track:**
- **mAP (mean Average Precision)**: >0.7 is good, >0.8 is excellent
- **Inference speed**: Target 20-30 FPS on modern hardware
- **False positives**: Should be <5%
- **False negatives**: Should be <10%

**Optimization techniques:**
1. **Model quantization**: Reduce size by 4x
   ```javascript
   await model.save('file://./model', {
     quantizationBytes: 2  // 16-bit quantization
   });
   ```

2. **Input size reduction**: 640→416 for faster inference
3. **Confidence threshold tuning**: Adjust 0.3-0.7 range
4. **NMS threshold**: Reduce overlapping boxes

**Testing checklist:**
- [ ] Detects all POS terminal types in dataset
- [ ] Works in different lighting conditions
- [ ] Handles occlusions (person standing in front)
- [ ] Minimal false positives on laptops/tablets
- [ ] Runs at acceptable FPS (>5 for analysis)
- [ ] Model size reasonable (<50MB)

---

## Option 2: Use Pre-trained Models (Faster)

### Timeline: 1-2 Days

Instead of training from scratch, use existing models:

**Option A: TensorFlow Hub Models**
```javascript
// Load pre-trained retail detector
const model = await tf.loadGraphModel(
  'https://tfhub.dev/tensorflow/efficientdet/d0/1',
  { fromTFHub: true }
);
```

**Option B: OpenCV.js with Cascade Classifiers**
- Pre-trained for generic object detection
- May work for POS terminals with fine-tuning

**Option C: Azure Custom Vision or Google AutoML**
- Upload your images (no coding needed)
- Cloud trains model for you
- Export to TensorFlow.js
- Cost: ~$20-50

---

## Option 3: ROI-Based Detection (Immediate)

### Timeline: Already in Phase 2 roadmap

This is the most practical immediate solution:

**How it works:**
1. User draws rectangle around POS/checkout area
2. System tracks ALL activity in that region
3. Detect people entering/leaving zone
4. Count transactions based on time spent
5. Alert on suspicious activity

**Advantages:**
- No custom training needed
- Works TODAY with existing COCO-SSD
- Very accurate for fixed camera positions
- Low computation cost

**Implementation:**
```javascript
// Define POS region
const posRegion = {
  x: 450,
  y: 150,
  width: 220,
  height: 180
};

// Filter detections inside region
const posActivity = detections.filter(det => {
  return isInsideRegion(det.bbox, posRegion);
});

// Track people at register
const peopleAtRegister = posActivity.filter(d => d.class === 'person');
```

**Use cases perfect for ROI:**
- Count customers at checkout
- Measure queue wait times
- Detect when register is unattended
- Alert when non-employee enters area
- Track peak hours

---

## Recommendation

Given your specific needs, I recommend a **phased approach**:

### Phase 1 (Immediate - This Week):
**Implement ROI Drawing Tool**
- Already in your Phase 2 roadmap (Task 7)
- Lets you manually mark POS areas
- Works with existing COCO-SSD
- Provides immediate value

### Phase 2 (Next 2-4 Weeks):
**Train Custom POS Model**
- Start collecting/labeling dataset
- Train YOLOv8 model
- Integrate as secondary detector
- Enhances ROI-based detection

### Phase 3 (1-2 Months):
**Hybrid System**
- ROI for fixed cameras (most accurate)
- Custom model for dynamic cameras
- COCO-SSD for general objects
- Best of all three approaches

---

## Getting Started Today

**Immediate next steps:**

1. **Continue with Phase 2 Tasks 5-7**:
   - Color-Coded Confidence
   - Confidence Meter UI
   - **ROI Drawing Tool** ← This will help immediately

2. **Start dataset collection in parallel**:
   - Extract frames from your videos
   - Organize into folders
   - Set up LabelImg tool

3. **Test ROI approach**:
   - Manually define checkout area coordinates
   - Filter detections to that region
   - Track people/activity metrics

**Questions to answer:**
1. Do your cameras move, or are they fixed?
   - Fixed → ROI is perfect
   - Moving → Need custom model

2. How many different POS terminal types do you have?
   - 1-2 types → Easier to train
   - 5+ types → Need larger dataset

3. What's your accuracy requirement?
   - 90%+ → Need custom model
   - 70-80%+ → ROI might suffice

---

## Cost Estimate

**Training Custom Model:**
- Software: Free (open source)
- Hardware: $0 (use existing) or $500-2000 (GPU)
- Cloud training: $20-100 (AWS/Google Cloud)
- Time: 40-80 hours of work

**Using ROI Approach:**
- Cost: $0
- Time: 4-8 hours implementation

**Hybrid Approach:**
- Cost: Training costs + ROI
- Time: 50-90 hours total

---

## Support Resources

**Training tutorials:**
- YOLOv8: https://docs.ultralytics.com
- TensorFlow.js: https://www.tensorflow.org/js/tutorials
- Custom object detection: https://tensorflow-object-detection-api-tutorial.readthedocs.io

**Community:**
- r/computervision
- r/MachineLearning  
- Stack Overflow `[object-detection]` tag

**Need help?** Let me know which approach you'd like to pursue and I can provide detailed implementation code.
