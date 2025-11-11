# 🎯 Quick Start: Custom Model Training

**30-Minute Overview for Getting Started**

---

## Phase 1: Data (30 minutes)

### Collect Images
- **Goal**: 500-2000 images per object class
- **Extract from video**: `ffmpeg -i video.mp4 -vf fps=0.5 frames/frame_%04d.jpg`
- **Or download**: Google Images, your existing footage

---

## Phase 2: Label (2-3 hours)

### Use Roboflow (Easiest)
1. Sign up: [roboflow.com](https://roboflow.com/)
2. Create project → Upload images
3. Draw boxes around objects
4. Export as "YOLOv8" format

---

## Phase 3: Train (2-4 hours)

### Google Colab (Free GPU!)

```python
# 1. Install
!pip install ultralytics roboflow

# 2. Download your Roboflow dataset
from roboflow import Roboflow
rf = Roboflow(api_key="YOUR_KEY")
project = rf.workspace().project("YOUR_PROJECT")
dataset = project.version(1).download("yolov8")

# 3. Train
from ultralytics import YOLO
model = YOLO('yolov8n.pt')
results = model.train(
    data=f'{dataset.location}/data.yaml',
    epochs=100,
    imgsz=640
)

# 4. Export
model.export(format='saved_model')

# 5. Download
!zip -r model.zip runs/detect/train/weights/best_saved_model
```

---

## Phase 4: Convert (10 minutes)

```bash
# Install converter
pip install tensorflowjs

# Convert to TensorFlow.js
tensorflowjs_converter \
    --input_format=tf_saved_model \
    --output_format=tfjs_graph_model \
    best_saved_model \
    public/models/custom_model
```

---

## Phase 5: Deploy (5 minutes)

1. Copy model to: `Video_AI/public/models/custom_model/`
2. Create `classes.json`:
```json
{
  "classes": ["atm", "your_object", "etc"]
}
```
3. Restart your app - model auto-detected!

---

## ⚡ Super Quick Test

Want to test without training? Use a pre-trained model:

```bash
# Download YOLO example
wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt

# Convert directly
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt').export(format='saved_model')"
```

---

## 🎯 Success Metrics

- **mAP50**: >0.8 (80% accuracy)
- **FPS**: >5 frames per second
- **False Positives**: <5%

---

## 📚 Full Guide

See **CUSTOM_MODEL_TRAINING_GUIDE.md** for complete instructions!

---

**Questions? Check the troubleshooting section in the full guide.**
