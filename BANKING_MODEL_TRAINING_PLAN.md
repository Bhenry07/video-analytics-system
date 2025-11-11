# 🏦 Banking Vertical - Custom Model Training Plan

**Project**: Banking Detection Model  
**Vertical**: Financial Institutions / Banks  
**Use Case**: Teller monitoring, customer interaction tracking, ATM usage analytics  
**Date Created**: November 10, 2025  
**Status**: Planning Phase

---

## 🎯 Detection Classes (5 Classes)

### 1. **bank-teller**
- **Description**: Bank employees working at teller stations
- **Key Features**: Behind counter, professional attire, often standing/sitting at station
- **Detection Goals**: Count active tellers, track teller utilization, identify staffing gaps

### 2. **teller-station**
- **Description**: Physical teller counter/workstation area
- **Key Features**: Counter desk, computer terminal, cash drawer area, privacy glass/barrier
- **Detection Goals**: Identify open vs. closed stations, track station usage patterns

### 3. **customer-at-teller**
- **Description**: Customers actively interacting with tellers
- **Key Features**: Person positioned in front of teller station, facing teller
- **Detection Goals**: Track transaction counts, estimate wait times, measure service duration

### 4. **customer-at-atm**
- **Description**: Customers using ATM machines
- **Key Features**: Person standing within 2 feet of ATM, facing machine
- **Detection Goals**: Monitor ATM usage frequency, detect long transactions, identify queue buildup

### 5. **atm-machine**
- **Description**: Automated Teller Machine (fixed object)
- **Key Features**: ATM kiosk/terminal, screen, card reader, cash dispenser
- **Detection Goals**: Locate ATMs in scene, track availability, monitor usage zones

---

## 📊 Training Data Requirements

### Image Quantity Targets

| Class                 | Minimum | Recommended | Ideal  | Priority |
|-----------------------|---------|-------------|--------|----------|
| bank-teller           | 500     | 1,000       | 1,500  | High     |
| teller-station        | 300     | 800         | 1,200  | Medium   |
| customer-at-teller    | 600     | 1,200       | 1,800  | High     |
| customer-at-atm       | 600     | 1,200       | 1,800  | High     |
| atm-machine           | 300     | 800         | 1,200  | Medium   |
| **TOTAL**             | **2,300** | **5,000** | **7,500** | -      |

### Data Diversity Requirements

**Essential Variations:**
- ✅ Multiple camera angles (overhead, side view, front view)
- ✅ Different lighting conditions (morning, afternoon, evening, night)
- ✅ Various demographics (age, gender, ethnicity)
- ✅ Different clothing styles (business, casual, seasonal)
- ✅ Branch layouts (different bank locations if available)
- ✅ Busy vs. quiet periods
- ✅ Weekend vs. weekday footage

**Data Quality Standards:**
- Resolution: Minimum 720p (1280x720), ideal 1080p
- Clear visibility of subjects (not blurry or obstructed)
- Representative of deployment conditions
- Balanced class distribution (avoid 90% one class)

---

## 🎬 Data Collection Strategy

### Phase 1: Extract from Existing Footage

**If you have existing bank surveillance videos:**

```powershell
# Extract 1 frame every 2 seconds (30 frames per minute)
ffmpeg -i bank_footage_morning.mp4 -vf "fps=0.5" frames/morning/frame_%04d.jpg

# Extract 1 frame every 5 seconds (12 frames per minute)
ffmpeg -i bank_footage_afternoon.mp4 -vf "fps=0.2" frames/afternoon/frame_%04d.jpg

# Extract high-quality frames at specific intervals
ffmpeg -i bank_footage.mp4 -vf "fps=0.5" -q:v 2 frames/frame_%05d.jpg
```

**Recommended extraction rates:**
- **Busy hours**: 0.5 fps (1 frame every 2 seconds) - captures customer flow
- **Normal hours**: 0.2 fps (1 frame every 5 seconds) - reduces redundancy
- **Quiet hours**: 0.1 fps (1 frame every 10 seconds) - minimal activity

### Phase 2: Organize by Time Period

```
banking_dataset/
├── morning_rush/     # 7am-10am (high traffic)
├── midday/           # 10am-2pm (moderate)
├── afternoon/        # 2pm-5pm (high traffic)
├── evening/          # 5pm-8pm (low traffic)
└── night/            # 8pm+ (ATM-only usage)
```

### Phase 3: Quality Check
- ✅ Remove duplicate/near-duplicate frames
- ✅ Remove blurry or obstructed images
- ✅ Remove frames with privacy concerns (visible faces/documents)
- ✅ Verify each class has sufficient representation

---

## 🏷️ Labeling Guidelines (Banking-Specific)

### Critical Rules for Consistency

#### **bank-teller** Labeling:
- ✅ Draw box around entire person (head to waist minimum)
- ✅ Include if person is behind teller counter
- ✅ Include tellers on break/inactive (train model to recognize role)
- ❌ Do NOT label customers behind counter (rare but happens)

#### **teller-station** Labeling:
- ✅ Draw box around counter area + computer terminal
- ✅ Include privacy glass/barrier if visible
- ✅ Label ALL stations (even if teller not present)
- ❌ Do NOT include queue/waiting area

#### **customer-at-teller** Labeling:
- ✅ Customer must be within 3 feet of teller station
- ✅ Customer must be facing teller (active interaction)
- ✅ Draw box around full person (head to feet if visible)
- ❌ Do NOT label customers waiting in queue
- ❌ Do NOT label customers walking past

#### **customer-at-atm** Labeling:
- ✅ Customer within 2 feet of ATM
- ✅ Customer facing ATM screen
- ✅ Include box around full person
- ❌ Do NOT label people walking near ATM
- ❌ Do NOT label people waiting behind ATM user

#### **atm-machine** Labeling:
- ✅ Draw box around entire ATM kiosk/terminal
- ✅ Include screen, card reader, cash dispenser
- ✅ Label even if customer is blocking view
- ❌ Do NOT include surrounding wall/furniture

### Ambiguous Cases:

**Scenario**: Customer handing documents to teller
- **Label**: `customer-at-teller` (active interaction)

**Scenario**: Person standing 4 feet from ATM (on phone)
- **Label**: Nothing (not interacting)

**Scenario**: Teller walking away from station
- **Label**: `bank-teller` (role recognition) + `teller-station` (if visible)

**Scenario**: Two customers at same teller
- **Label**: Both as `customer-at-teller` (separate boxes)

---

## 🤖 Training Configuration

### Recommended Model: YOLOv8m (Medium)

**Why Medium vs. Nano/Small?**
- Better accuracy for nuanced banking scenarios
- Can distinguish similar classes (teller vs. customer)
- Still fast enough for real-time (15-25 FPS)
- Banking applications prioritize accuracy over speed

### Training Parameters

```python
from ultralytics import YOLO

# Load pretrained model
model = YOLO('yolov8m.pt')

# Train on banking dataset
results = model.train(
    data='banking_dataset.yaml',      # Roboflow dataset config
    epochs=150,                        # More epochs for complex scenes
    imgsz=640,                         # Standard size
    batch=16,                          # Adjust based on GPU memory
    patience=25,                       # Early stopping
    save=True,
    project='banking_detection',
    name='banking_v1',
    
    # Banking-specific optimizations
    conf=0.25,                         # Lower confidence during training
    iou=0.6,                           # IoU threshold for NMS
    augment=True,                      # Enable augmentation
    mosaic=1.0,                        # Mosaic augmentation
    mixup=0.1,                         # Mixup augmentation
    copy_paste=0.1,                    # Copy-paste augmentation
    degrees=5.0,                       # Slight rotation (cameras aren't perfect)
    translate=0.1,                     # Slight translation
    scale=0.2,                         # Scale augmentation
    flipud=0.0,                        # No vertical flip (gravity matters)
    fliplr=0.5,                        # Horizontal flip OK
    hsv_h=0.015,                       # Hue variation (lighting)
    hsv_s=0.4,                         # Saturation variation
    hsv_v=0.4,                         # Value/brightness variation
)
```

### Success Metrics (Banking Vertical)

| Metric               | Minimum | Target  | Excellent | Description                          |
|----------------------|---------|---------|-----------|--------------------------------------|
| **mAP50**            | 0.75    | 0.85    | 0.90+     | Mean Average Precision at 50% IoU    |
| **mAP50-95**         | 0.50    | 0.60    | 0.70+     | Stricter metric across IoU thresholds|
| **Precision**        | 0.80    | 0.88    | 0.92+     | Reduce false positives               |
| **Recall**           | 0.75    | 0.85    | 0.90+     | Catch all actual objects             |
| **Inference Speed**  | >5 FPS  | >10 FPS | >15 FPS   | Real-time performance on CPU         |

**Banking-Specific Validation:**
- ✅ Correctly distinguishes teller from customer (>95% accuracy)
- ✅ Detects customers at ATM vs. walking past (>90% accuracy)
- ✅ Identifies all teller stations regardless of occupancy (>95% accuracy)
- ✅ Low false positives for customer interactions (<5%)

---

## 🔄 Complete Training Workflow

### Step 1: Setup Roboflow Account (10 minutes)

1. Go to https://roboflow.com (free account)
2. Create new project: "banking-detection-v1"
3. Select "Object Detection (Bounding Box)"
4. Add 5 classes: bank-teller, teller-station, customer-at-teller, customer-at-atm, atm-machine

### Step 2: Upload & Organize Images (30-60 minutes)

1. Upload images in batches (500-1000 at a time)
2. Roboflow auto-assigns to train/val/test (70/20/10 split)
3. Or manually organize by creating folders:
   - `train/` - 70% of images
   - `valid/` - 20% of images
   - `test/` - 10% of images

### Step 3: Label Images (20-40 hours for 5000 images)

**Labeling Time Estimates:**
- Simple scene (1-2 objects): 20-30 seconds per image
- Complex scene (5+ objects): 60-90 seconds per image
- Average: ~30-45 seconds per image
- **5,000 images ≈ 25-35 hours of labeling**

**Labeling Tips:**
- Use keyboard shortcuts (Roboflow has hotkeys for classes)
- Label in batches by class (all tellers first, then customers, etc.)
- Take breaks every hour (accuracy degrades with fatigue)
- Have 2-3 people label same 100 images to ensure consistency

### Step 4: Configure Augmentations (5 minutes)

Roboflow generates additional training images:

**Recommended augmentations:**
- ✅ Rotation: ±5° (slight camera tilt)
- ✅ Brightness: ±15% (lighting variation)
- ✅ Exposure: ±10% (camera adjustments)
- ✅ Blur: Up to 1.5px (motion/camera blur)
- ✅ Noise: Up to 2% (sensor noise)
- ❌ Flip Horizontal: Only if your cameras don't have fixed orientation
- ❌ Flip Vertical: NO (gravity matters, people don't stand upside down)
- ❌ Crop: Minimal (might cut off people)

**Target**: 2-3x augmentation multiplier
- 5,000 original images → 10,000-15,000 training images

### Step 5: Generate & Export Dataset (5 minutes)

1. Click "Generate" in Roboflow
2. Select format: **YOLOv8**
3. Download or get API code
4. You'll receive a `data.yaml` file with paths and classes

### Step 6: Train in Google Colab (2-4 hours)

**Open Google Colab**: https://colab.research.google.com

**Complete Training Notebook:**

```python
# ==================================================
# BANKING DETECTION MODEL - TRAINING NOTEBOOK
# YOLOv8 Custom Model for Financial Institutions
# ==================================================

# 1. Setup Environment
!nvidia-smi  # Verify GPU (should see T4 or better)

# 2. Install Dependencies
!pip install ultralytics roboflow

# 3. Import Libraries
from ultralytics import YOLO
from roboflow import Roboflow
import os

# 4. Download Dataset from Roboflow
rf = Roboflow(api_key="YOUR_ROBOFLOW_API_KEY")
project = rf.workspace("YOUR_WORKSPACE").project("banking-detection-v1")
dataset = project.version(1).download("yolov8")

# 5. Verify Dataset
print(f"Dataset location: {dataset.location}")
print("Classes:", dataset.classes)

# Expected output:
# ['bank-teller', 'teller-station', 'customer-at-teller', 
#  'customer-at-atm', 'atm-machine']

# 6. Load Pretrained Model
model = YOLO('yolov8m.pt')  # Medium model for banking accuracy

# 7. Configure Training
results = model.train(
    data=f"{dataset.location}/data.yaml",
    epochs=150,                # Banking needs more epochs
    imgsz=640,
    batch=16,                  # Reduce to 8 if GPU memory issues
    patience=25,
    save=True,
    project='banking_detection',
    name='banking_v1',
    
    # Augmentation
    degrees=5.0,
    translate=0.1,
    scale=0.2,
    flipud=0.0,
    fliplr=0.5,
    hsv_h=0.015,
    hsv_s=0.4,
    hsv_v=0.4,
    
    # Optimization
    optimizer='AdamW',
    lr0=0.001,
    weight_decay=0.0005,
)

# 8. Validate Model
metrics = model.val()
print(f"mAP50: {metrics.box.map50:.3f}")
print(f"mAP50-95: {metrics.box.map:.3f}")
print(f"Precision: {metrics.box.p:.3f}")
print(f"Recall: {metrics.box.r:.3f}")

# 9. Test Predictions
model.predict(
    source=f"{dataset.location}/test/images",
    save=True,
    conf=0.6,  # Banking confidence threshold
    project='predictions',
    name='banking_test'
)

# 10. Export to TensorFlow SavedModel
model.export(format='saved_model')  # Creates saved_model folder

# 11. Download Model Files
from google.colab import files
import shutil

# Zip the saved_model folder
shutil.make_archive('banking_model', 'zip', 'banking_detection/banking_v1/weights')
files.download('banking_model.zip')

print("✅ Training complete! Download banking_model.zip")
```

**Monitor Training:**
- Watch mAP50 increase (should reach >0.80 by epoch 100)
- Check loss decreasing (box_loss, cls_loss, dfl_loss)
- Training should take 2-4 hours on T4 GPU

### Step 7: Convert to TensorFlow.js (15 minutes)

**On your local machine:**

```powershell
# 1. Extract downloaded model
Expand-Archive banking_model.zip -DestinationPath banking_model

# 2. Install TensorFlow.js converter
pip install tensorflowjs

# 3. Convert to web format
tensorflowjs_converter `
    --input_format=tf_saved_model `
    --output_format=tfjs_graph_model `
    --signature_name=serving_default `
    --saved_model_tags=serve `
    banking_model/saved_model `
    banking_tfjs

# 4. Create classes.json
@"
[
  "bank-teller",
  "teller-station",
  "customer-at-teller",
  "customer-at-atm",
  "atm-machine"
]
"@ | Out-File -FilePath banking_tfjs/classes.json -Encoding utf8
```

### Step 8: Deploy to Your App (10 minutes)

```powershell
# 1. Create model directory
New-Item -ItemType Directory -Path "C:\Users\bhenry\Desktop\HDM_Projects\Video_AI\public\models\banking_model" -Force

# 2. Copy model files
Copy-Item banking_tfjs/* "C:\Users\bhenry\Desktop\HDM_Projects\Video_AI\public\models\banking_model\"

# 3. Verify files
Get-ChildItem "C:\Users\bhenry\Desktop\HDM_Projects\Video_AI\public\models\banking_model"

# Should see:
# - model.json
# - group1-shard1of1.bin (or multiple shards)
# - classes.json
```

**Update detection-engine.js:**

```javascript
// In detection-engine.js, change model path:
async loadModel(modelType = 'coco-ssd') {
    try {
        this.isLoading = true;
        
        if (modelType === 'banking') {
            // Load custom banking model
            this.model = await tf.loadGraphModel('/models/banking_model/model.json');
            
            // Load class names
            const response = await fetch('/models/banking_model/classes.json');
            this.classes = await response.json();
            
            console.log('Banking model loaded:', this.classes);
        } else {
            // Default COCO-SSD
            this.model = await cocoSsd.load();
        }
        
        this.isLoading = false;
        return this.model;
    } catch (error) {
        console.error('Error loading model:', error);
        this.isLoading = false;
        throw error;
    }
}
```

### Step 9: Test Banking Model (30 minutes)

**Test checklist:**
- [ ] Model loads without errors
- [ ] All 5 classes detect correctly
- [ ] bank-teller vs customer-at-teller distinguished
- [ ] customer-at-atm only triggers when person at machine
- [ ] teller-station detected even when empty
- [ ] ATM detection works (fixes your original issue!)
- [ ] Performance acceptable (>5 FPS)
- [ ] Low false positives

---

## 📈 Banking-Specific Analytics (Post-Training)

Once your model is deployed, create banking vertical analytics:

### Key Metrics to Track:

1. **Teller Utilization**
   - Active tellers / Total teller stations
   - Average service time per customer
   - Idle time per teller

2. **Customer Flow**
   - Customers served per hour
   - Average wait time estimation
   - Peak hours identification

3. **ATM Usage**
   - ATM transactions per hour
   - Average transaction duration
   - ATM availability monitoring

4. **Staffing Insights**
   - Optimal teller count by time of day
   - Understaffed periods detection
   - Branch comparison metrics

### Heat Map Applications:

- **Teller station usage** (which stations are busiest)
- **ATM location optimization** (where customers gather)
- **Queue formation patterns** (where customers wait)
- **Traffic flow** (customer movement through branch)

---

## 🎓 Training Best Practices (Banking Vertical)

### Data Quality > Quantity
- 3,000 high-quality, diverse images > 10,000 similar images
- Ensure balanced classes (don't have 90% teller, 10% customer)
- Include edge cases (multiple customers, empty stations, etc.)

### Privacy Considerations
- ✅ Blur faces if required by privacy policies
- ✅ Ensure no visible account numbers/documents
- ✅ Comply with bank security policies
- ✅ Get proper approvals before using footage

### Iteration Strategy
1. **Phase 1**: Train with 2,000 images → Test → Identify weak classes
2. **Phase 2**: Collect 1,000 more images of weak classes → Retrain
3. **Phase 3**: Fine-tune confidence thresholds for production

### Multi-Bank Deployment
If deploying to multiple banks:
- Collect data from 3+ different bank locations
- Include different layouts/architectures
- Test on footage from NEW banks (not in training set)
- Consider transfer learning for bank-specific fine-tuning

---

## 🚨 Common Issues & Solutions

### Issue: Low mAP50 (<0.70)
**Solutions:**
- Collect more training data (need 800+ per class minimum)
- Improve labeling consistency (audit random 100 images)
- Train longer (increase epochs to 200)
- Check class imbalance (use weighted loss)

### Issue: Confuses teller with customer
**Solutions:**
- Add more context to labels (include counter in teller-station labels)
- Increase "customer-at-teller" training data
- Use contextual features (position relative to counter)

### Issue: Misses customers at ATM
**Solutions:**
- Collect more ATM interaction images (variations in distance)
- Include images of people approaching/leaving ATM (labeled as NOT customer-at-atm)
- Tighten proximity definition (must be within 2 feet)

### Issue: False positives on walking customers
**Solutions:**
- Add negative examples (people walking past, labeled as background)
- Stricter confidence threshold (0.7 instead of 0.5)
- Add temporal logic (must be stationary for 2+ seconds)

---

## 📋 Quick Checklist

- [ ] Define 5 banking detection classes
- [ ] Collect 5,000+ images from bank footage
- [ ] Extract frames using FFmpeg
- [ ] Create Roboflow account and project
- [ ] Upload and organize images
- [ ] Label all objects (25-35 hours)
- [ ] Configure augmentations (2-3x multiplier)
- [ ] Generate YOLOv8 dataset
- [ ] Train in Google Colab (2-4 hours)
- [ ] Validate mAP50 >0.85
- [ ] Export to SavedModel format
- [ ] Convert to TensorFlow.js
- [ ] Deploy to app (public/models/banking_model/)
- [ ] Update detection-engine.js
- [ ] Test all 5 classes
- [ ] Tune confidence thresholds
- [ ] Build banking analytics dashboard
- [ ] Document results and accuracy metrics

---

## 🎯 Success Criteria

Your banking model is production-ready when:

✅ **Accuracy**: mAP50 >0.85, precision >0.88, recall >0.85  
✅ **Performance**: >10 FPS on typical hardware  
✅ **Reliability**: <5% false positives in production testing  
✅ **Distinguishes**: Teller vs. customer with >95% accuracy  
✅ **ATM Detection**: Correctly identifies ATMs (fixes your original issue!)  
✅ **Robustness**: Works across different lighting, angles, and times  
✅ **Scalability**: Performs well at multiple bank locations

---

## 📞 Next Steps

**Ready to start? Here's your action plan:**

1. **Immediate** (Today): Identify which bank footage you have access to
2. **This Week**: Extract frames using FFmpeg commands above
3. **Week 1-2**: Setup Roboflow and complete labeling (25-35 hours)
4. **Week 2**: Train model in Google Colab (4 hours)
5. **Week 3**: Deploy, test, and iterate

**Need help?** I can assist with:
- ✅ Writing FFmpeg extraction scripts for your specific videos
- ✅ Setting up the Colab notebook
- ✅ Troubleshooting training issues
- ✅ Optimizing model performance
- ✅ Building custom banking analytics

---

**Created**: November 10, 2025  
**Last Updated**: November 10, 2025  
**Version**: 1.0  
**Author**: Video Analytics Development Team
