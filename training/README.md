# YOLOv8 Training Pipeline

Complete pipeline for training custom object detection models on your exported dataset.

## 📋 Prerequisites

```bash
pip install ultralytics torch torchvision
```

## 🚀 Quick Start

### Step 1: Prepare Dataset
```bash
python prepare_dataset.py path/to/your/banking_dataset_*.zip
```

This will:
- Extract images and annotations from ZIP
- Split into train/val/test (80/15/5%)
- Create `training_data/` folder with proper structure
- Generate `dataset.yaml` config file

### Step 2: Train Model
```bash
# Quick training (100 epochs, nano model)
python train_model.py

# Custom training
python train_model.py --model s --epochs 200 --batch 32
```

**Model sizes:**
- `n` (nano): Fastest, least accurate ~2M params
- `s` (small): Balanced ~9M params ⭐ **Recommended**
- `m` (medium): More accurate ~20M params
- `l` (large): Very accurate ~43M params
- `x` (xlarge): Most accurate ~68M params

**Training options:**
```bash
python train_model.py \
  --data training_data/dataset.yaml \
  --model s \
  --epochs 200 \
  --batch 16 \
  --img-size 640 \
  --device 0 \
  --name banking_v1
```

### Step 3: Results

After training completes, find your model at:
```
runs/train/banking_detection/weights/
├── best.pt          # Best model checkpoint
├── last.pt          # Last epoch checkpoint
└── best.onnx        # ONNX export (for deployment)
```

## 📊 Training Details

### Dataset Structure
```
training_data/
├── images/
│   ├── train/       # 364 images (80%)
│   ├── val/         # 68 images (15%)
│   └── test/        # 23 images (5%)
├── labels/
│   ├── train/       # YOLO format annotations
│   ├── val/
│   └── test/
├── dataset.yaml     # Dataset configuration
└── classes.txt      # Class names
```

### Expected Training Time

**With GPU (NVIDIA):**
- 100 epochs: ~30 minutes
- 200 epochs: ~60 minutes

**With CPU:**
- 100 epochs: ~3 hours ⚠️ (Not recommended)

### Memory Requirements
- **Nano/Small**: 4GB VRAM
- **Medium**: 6GB VRAM
- **Large/XLarge**: 8GB+ VRAM

## 🎯 Usage After Training

### Python
```python
from ultralytics import YOLO

# Load your trained model
model = YOLO('runs/train/banking_detection/weights/best.pt')

# Run inference
results = model('path/to/image.jpg')

# Process results
for result in results:
    boxes = result.boxes
    for box in boxes:
        cls = int(box.cls[0])
        conf = float(box.conf[0])
        xyxy = box.xyxy[0].tolist()
        print(f"Class: {model.names[cls]}, Confidence: {conf:.2f}, Box: {xyxy}")
```

### Command Line
```bash
# Predict on single image
yolo predict model=runs/train/banking_detection/weights/best.pt source=image.jpg

# Predict on video
yolo predict model=runs/train/banking_detection/weights/best.pt source=video.mp4

# Predict on webcam
yolo predict model=runs/train/banking_detection/weights/best.pt source=0
```

## 🔧 Troubleshooting

### CUDA Out of Memory
Reduce batch size:
```bash
python train_model.py --batch 8  # or --batch 4
```

### Training Too Slow
- Use smaller model: `--model n`
- Reduce image size: `--img-size 416`
- Enable GPU if available

### Low Accuracy
- Train longer: `--epochs 200` or `--epochs 300`
- Use larger model: `--model m`
- Add more training data
- Review and fix annotation errors

## 📈 Monitoring Training

Training logs and metrics are saved to:
- **TensorBoard**: `tensorboard --logdir runs/train`
- **Images**: `runs/train/banking_detection/` (confusion matrix, predictions, etc.)
- **Metrics**: Printed to console during training

## 🚀 Next Steps

After training:
1. Review validation results in `runs/train/banking_detection/`
2. Test model on new images
3. If accuracy is good, integrate into your Video Analytics app
4. If accuracy is low, collect more data or train longer

## 📚 Resources

- [Ultralytics Docs](https://docs.ultralytics.com/)
- [YOLOv8 GitHub](https://github.com/ultralytics/ultralytics)
- [Training Tips](https://docs.ultralytics.com/guides/model-training-tips/)
