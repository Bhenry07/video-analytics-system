# 🎯 Custom AI Model Training Guide

**For Video Analytics System - Training Your Own Object Detection Model**

Last Updated: 2025-11-10

---

## 📋 Overview

This guide walks you through training a custom YOLOv8 model for your specific needs (ATMs, specific vehicles, custom equipment, etc.) and integrating it into your Video Analytics System.

**Training Time**: 2-4 hours (with GPU)  
**Training Data Needed**: 500-2000 images per class  
**Difficulty**: Intermediate  
**Cost**: Free (using Google Colab GPU)

---

## 🎯 What You'll Achieve

- Detect **custom objects** not in COCO dataset (ATMs, vending machines, specific equipment)
- **Higher accuracy** for your specific use case
- **Eliminate misidentifications** (like ATM → oven)
- Professional-grade detection tailored to your needs

---

## 📦 Phase 1: Data Collection & Preparation

### Step 1.1: Collect Images

You need **500-2000 images per object class**. More is better!

**Image Requirements:**
- Various angles and distances
- Different lighting conditions (day/night)
- Different backgrounds
- Various weather conditions (if outdoor)
- Mix of clear and partially obscured objects

**Sources:**
1. **Your Own Footage**: Extract frames from existing videos
2. **Public Datasets**: Search [Roboflow Universe](https://universe.roboflow.com/)
3. **Google Images**: Use tools like [Fatkun Batch Downloader](https://chrome.google.com/webstore/detail/fatkun-batch-download-ima/nnjjahlikiabnchcpehcpkdeckfgnohf)
4. **Record New Footage**: Capture video and extract frames

**Extracting Frames from Video:**
```bash
# Install FFmpeg (if not installed)
# Windows: Download from https://ffmpeg.org/download.html

# Extract 1 frame per second
ffmpeg -i your_video.mp4 -vf fps=1 frames/frame_%04d.jpg

# Extract 1 frame every 2 seconds (recommended)
ffmpeg -i your_video.mp4 -vf fps=0.5 frames/frame_%04d.jpg
```

### Step 1.2: Organize Your Dataset

Create this folder structure:

```
custom_dataset/
├── images/
│   ├── train/     # 80% of images
│   │   ├── img1.jpg
│   │   ├── img2.jpg
│   │   └── ...
│   └── val/       # 20% of images
│       ├── img1.jpg
│       └── ...
└── labels/
    ├── train/     # Corresponding labels
    │   ├── img1.txt
    │   ├── img2.txt
    │   └── ...
    └── val/
        ├── img1.txt
        └── ...
```

---

## 🏷️ Phase 2: Label Your Data

### Step 2.1: Choose a Labeling Tool

**Recommended: [Roboflow](https://roboflow.com/)** (Free, easiest)
- Web-based, no installation
- Auto-assists labeling
- Exports in YOLO format
- Free for small projects

**Alternative: [CVAT](https://cvat.org/)** (Free, more powerful)
- Self-hosted or cloud
- Advanced features
- Steeper learning curve

### Step 2.2: Label Using Roboflow (Recommended)

1. **Sign up** at [roboflow.com](https://roboflow.com/)

2. **Create New Project**
   - Click "Create New Project"
   - Select "Object Detection"
   - Name it (e.g., "ATM Detection")

3. **Upload Images**
   - Drag and drop your images
   - Roboflow auto-splits train/val

4. **Define Classes**
   ```
   Example classes:
   - atm
   - vending_machine
   - security_camera
   - specific_vehicle_type
   - custom_equipment
   ```

5. **Draw Bounding Boxes**
   - Click and drag around each object
   - Label each box with the correct class
   - Use keyboard shortcuts for speed:
     - `Spacebar` - Next image
     - `1, 2, 3...` - Quick class selection

6. **Quality Tips**
   - Box should be tight around object
   - Include all visible parts
   - Don't overlap boxes unnecessarily
   - Be consistent with edge cases

### Step 2.3: Export Dataset

1. Click **"Generate"** → **"Create Version"**
2. Choose preprocessing options:
   - ✅ Auto-Orient
   - ✅ Resize: 640x640 (YOLO standard)
3. Click **"Generate"**
4. Click **"Export"** → **"YOLOv8"** format
5. Download the dataset

**You'll get:**
```
dataset.zip
├── data.yaml        # Dataset configuration
├── train/
│   ├── images/
│   └── labels/
├── valid/
│   ├── images/
│   └── labels/
└── README.roboflow.txt
```

---

## 🚀 Phase 3: Train Your Model

### Step 3.1: Set Up Google Colab (Free GPU!)

1. Go to [colab.research.google.com](https://colab.research.google.com/)
2. Click **"New Notebook"**
3. Enable GPU:
   - `Runtime` → `Change runtime type`
   - Select `T4 GPU` (free)
   - Click `Save`

### Step 3.2: Training Code

Copy and paste this into Colab cells:

```python
# Cell 1: Install YOLOv8
!pip install ultralytics roboflow

# Cell 2: Import Libraries
from ultralytics import YOLO
from roboflow import Roboflow
import os

# Cell 3: Download Your Dataset from Roboflow
rf = Roboflow(api_key="YOUR_API_KEY")  # Get from Roboflow settings
project = rf.workspace("YOUR_WORKSPACE").project("YOUR_PROJECT")
dataset = project.version(1).download("yolov8")

# Cell 4: Train the Model
model = YOLO('yolov8n.pt')  # Start with nano model (fastest)

results = model.train(
    data=f'{dataset.location}/data.yaml',
    epochs=100,              # More epochs = better accuracy (try 50-200)
    imgsz=640,               # Image size
    batch=16,                # Adjust based on GPU memory
    patience=20,             # Early stopping
    save=True,
    project='runs/detect',
    name='custom_model'
)

# Cell 5: Validate the Model
metrics = model.val()
print(f"mAP50: {metrics.box.map50}")
print(f"mAP50-95: {metrics.box.map}")

# Cell 6: Test on Sample Images
results = model.predict(
    source=f'{dataset.location}/valid/images',
    save=True,
    conf=0.5
)

# Cell 7: Export for TensorFlow.js
model.export(format='saved_model')  # Export to TensorFlow SavedModel
print("Model exported to: runs/detect/custom_model/weights/best_saved_model")
```

### Step 3.3: Monitor Training

Watch for:
- **mAP50** (mean Average Precision): Target >0.8 (80%)
- **Loss decreasing**: Should drop steadily
- **Overfitting**: If val loss increases while train loss decreases

**Training Tips:**
- Start with 50 epochs, increase if needed
- If accuracy is low, collect more diverse data
- If overfitting, add data augmentation

### Step 3.4: Download Trained Model

```python
# Cell 8: Prepare for Download
!zip -r custom_model.zip runs/detect/custom_model/weights/best_saved_model

# Download the zip file (click folder icon → right-click → download)
```

---

## 🔄 Phase 4: Convert to TensorFlow.js

### Step 4.1: Install Converter (Local Machine)

```bash
pip install tensorflowjs
```

### Step 4.2: Convert the Model

```bash
# Unzip your model
unzip custom_model.zip -d custom_model

# Convert to TensorFlow.js format
tensorflowjs_converter \
    --input_format=tf_saved_model \
    --output_format=tfjs_graph_model \
    --signature_name=serving_default \
    --saved_model_tags=serve \
    custom_model/best_saved_model \
    public/models/custom_model
```

**Output:**
```
public/models/custom_model/
├── model.json           # Model architecture
├── group1-shard1of*.bin # Model weights (may be multiple files)
└── group1-shard2of*.bin
```

---

## 🔌 Phase 5: Integrate into Your App

Your app already supports custom models! Just add your model:

### Step 5.1: Copy Model Files

Place your converted model in:
```
Video_AI/
└── public/
    └── models/
        └── custom_model/
            ├── model.json
            └── *.bin files
```

### Step 5.2: Update Model Configuration

The app will auto-detect your custom model. You can select it from the UI dropdown (feature already built into your app's architecture).

### Step 5.3: Update Class Names

Edit `public/models/custom_model/classes.json`:

```json
{
  "classes": [
    "atm",
    "vending_machine",
    "security_camera",
    "your_custom_class"
  ]
}
```

---

## 📊 Phase 6: Test & Optimize

### Performance Benchmarks

| Model Size | Speed (FPS) | Accuracy | Use Case |
|------------|-------------|----------|----------|
| YOLOv8n (nano) | 15-30 FPS | Good | Real-time, webcams |
| YOLOv8s (small) | 10-20 FPS | Better | Balanced |
| YOLOv8m (medium) | 5-15 FPS | Best | High accuracy needed |

### Optimization Tips

**If too slow:**
- Use YOLOv8n instead of YOLOv8s/m
- Lower image resolution (320x320)
- Increase detection interval

**If not accurate enough:**
- Collect more training data
- Train for more epochs
- Use larger model (YOLOv8m)
- Adjust confidence threshold

---

## 🎓 Model Training Best Practices

### Data Quality > Data Quantity

**Good Training Data:**
- ✅ Clear, well-lit images
- ✅ Various angles and distances
- ✅ Diverse backgrounds
- ✅ Consistent labeling
- ✅ Balanced classes (similar # images per class)

**Bad Training Data:**
- ❌ Blurry images
- ❌ All from same camera angle
- ❌ Over-exposed or too dark
- ❌ Inconsistent labeling
- ❌ Imbalanced (1000 of class A, 50 of class B)

### Training Iterations

1. **First Model**: Train with 500-1000 images, 50 epochs
2. **Evaluate**: Test on real videos, find failure cases
3. **Add Data**: Collect more images of failure cases
4. **Retrain**: Use new data, increase epochs
5. **Repeat**: Until satisfactory performance

---

## 🔍 Troubleshooting

### Issue: Low mAP50 (<0.5)

**Solutions:**
- Add more training images
- Improve labeling quality (review and fix boxes)
- Train for more epochs
- Check if classes are too similar (merge them)

### Issue: Model Detects Nothing

**Solutions:**
- Lower confidence threshold (try 0.3)
- Check if input image size matches training (640x640)
- Verify model loaded correctly (check console)

### Issue: Too Many False Positives

**Solutions:**
- Increase confidence threshold (try 0.6-0.7)
- Add negative examples (images without objects)
- Review training data for mislabeled images

### Issue: Slow Performance

**Solutions:**
- Use smaller model (YOLOv8n)
- Reduce image resolution
- Increase detection interval (lower FPS)
- Use Web Worker for background processing

---

## 📚 Additional Resources

### Learning Resources
- [YOLOv8 Documentation](https://docs.ultralytics.com/)
- [Roboflow Blog](https://blog.roboflow.com/)
- [Computer Vision Course](https://www.coursera.org/learn/convolutional-neural-networks)

### Tools
- [Roboflow](https://roboflow.com/) - Dataset management
- [CVAT](https://cvat.org/) - Advanced labeling
- [Netron](https://netron.app/) - Model visualization

### Datasets
- [Roboflow Universe](https://universe.roboflow.com/) - Public datasets
- [Open Images](https://storage.googleapis.com/openimages/web/index.html) - Google dataset
- [COCO Dataset](https://cocodataset.org/) - Common Objects

---

## 🚀 Quick Start Checklist

- [ ] Collect 500+ images per class
- [ ] Sign up for Roboflow account
- [ ] Upload and label images
- [ ] Export as YOLOv8 format
- [ ] Open Google Colab with GPU
- [ ] Train model (100 epochs)
- [ ] Download trained model
- [ ] Convert to TensorFlow.js
- [ ] Copy to `public/models/custom_model/`
- [ ] Test in your app
- [ ] Optimize and iterate

---

## 💡 Example Use Cases

### ATM Detection System
**Classes**: `atm`, `person`, `vehicle`  
**Training Data**: 1000 ATM images, various banks  
**Use**: Security monitoring, suspicious activity detection

### Parking Lot Monitor
**Classes**: `car`, `truck`, `empty_spot`, `reserved_spot`  
**Training Data**: 2000 parking space images  
**Use**: Real-time parking availability

### Retail Analytics
**Classes**: `customer`, `shopping_cart`, `checkout_queue`  
**Training Data**: 1500 store images  
**Use**: Queue management, customer flow analysis

---

## 📞 Need Help?

If you get stuck:
1. Check the troubleshooting section above
2. Review training metrics in Colab
3. Test with COCO-SSD first to verify app works
4. Start with a smaller dataset to test pipeline

**Common First-Timer Mistakes:**
- Not enough training data
- Inconsistent labeling
- Training for too few epochs
- Not testing on real-world data

---

## 🎉 Success Criteria

You'll know your model is ready when:
- ✅ mAP50 > 0.8 on validation set
- ✅ Detects objects in your test videos
- ✅ Minimal false positives (<5%)
- ✅ Runs at acceptable FPS (>5 FPS)
- ✅ Generalizes to new camera angles/lighting

---

**Ready to train your custom model? Start with Phase 1! 🚀**

_Last Updated: 2025-11-10_
_Video Analytics System v2.0_
