# YOLOv8 Training on Google Colab - Step by Step Guide

Since the notebook has upload issues, here's a simple copy-paste approach:

## Method 1: Direct Copy-Paste into Colab

1. Go to https://colab.research.google.com/
2. Click "New Notebook"
3. Click "Runtime" > "Change runtime type" > Select "T4 GPU"
4. Copy and paste each code block below into separate cells

---

## Cell 1: Install Dependencies

```python
!pip install ultralytics -q

import torch
from ultralytics import YOLO
print(f"PyTorch: {torch.__version__}")
print(f"CUDA: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
```

---

## Cell 2: Upload Dataset ZIP

```python
from google.colab import files
import zipfile
from pathlib import Path

print("Upload your banking_dataset zip file:")
uploaded = files.upload()

zip_filename = list(uploaded.keys())[0]
print(f"Uploaded: {zip_filename}")
print(f"Size: {len(uploaded[zip_filename]) / 1024 / 1024:.1f} MB")
```

---

## Cell 3: Prepare Dataset

```python
import random
import shutil
import os

print("Preparing dataset...")

# Create directories
base_path = Path('dataset')
dirs = {
    'train_images': base_path / 'images' / 'train',
    'train_labels': base_path / 'labels' / 'train',
    'val_images': base_path / 'images' / 'val',
    'val_labels': base_path / 'labels' / 'val',
    'test_images': base_path / 'images' / 'test',
    'test_labels': base_path / 'labels' / 'test',
}

for dir_path in dirs.values():
    dir_path.mkdir(parents=True, exist_ok=True)

# Extract ZIP
temp_extract = Path('temp_extract')
temp_extract.mkdir(exist_ok=True)

with zipfile.ZipFile(zip_filename, 'r') as zip_ref:
    zip_ref.extractall(temp_extract)

images_dir = temp_extract / 'images'
annotations_dir = temp_extract / 'annotations'

# Get image files
image_files = list(images_dir.glob('*.jpg'))
print(f"Found {len(image_files)} images")

# Split dataset (80/15/5)
random.seed(42)
random.shuffle(image_files)

total = len(image_files)
train_split = int(0.8 * total)
val_split = int(0.95 * total)

train_files = image_files[:train_split]
val_files = image_files[train_split:val_split]
test_files = image_files[val_split:]

print(f"Split: {len(train_files)} train, {len(val_files)} val, {len(test_files)} test")

# Copy files
def copy_split(files, img_dir, label_dir):
    for img_file in files:
        shutil.copy2(img_file, img_dir / img_file.name)
        label_file = annotations_dir / img_file.with_suffix('.txt').name
        if label_file.exists():
            shutil.copy2(label_file, label_dir / label_file.name)

copy_split(train_files, dirs['train_images'], dirs['train_labels'])
copy_split(val_files, dirs['val_images'], dirs['val_labels'])
copy_split(test_files, dirs['test_images'], dirs['test_labels'])

# Read classes
classes_file = temp_extract / 'classes.txt'
if classes_file.exists():
    with open(classes_file, 'r') as f:
        class_names = [line.strip() for line in f.readlines()]
else:
    class_names = ['person', 'car', 'truck', 'handbag', 'backpack', 'bottle', 'cell phone']

print(f"Classes: {', '.join(class_names)}")

# Create dataset.yaml
yaml_content = f"""path: /content/dataset
train: images/train
val: images/val
test: images/test

names:
"""

for idx, class_name in enumerate(class_names):
    yaml_content += f"  {idx}: {class_name}\n"

yaml_path = base_path / 'dataset.yaml'
with open(yaml_path, 'w') as f:
    f.write(yaml_content)

# Clean up
shutil.rmtree(temp_extract)
os.remove(zip_filename)

print("Dataset ready!")
```

---

## Cell 4: Train Model

```python
# Configuration
MODEL_SIZE = 's'  # n=nano, s=small, m=medium, l=large
EPOCHS = 100
BATCH_SIZE = 16

print(f"Training YOLOv8{MODEL_SIZE.upper()} for {EPOCHS} epochs...")

# Load model
model = YOLO(f'yolov8{MODEL_SIZE}.pt')

# Train
results = model.train(
    data='dataset/dataset.yaml',
    epochs=EPOCHS,
    imgsz=640,
    batch=BATCH_SIZE,
    device=0,
    project='runs/train',
    name='banking_detection',
    pretrained=True,
    amp=True,
    fliplr=0.5,
)

print("Training complete!")
```

---

## Cell 5: Validate Model

```python
# Validate
metrics = model.val()

print(f"Results:")
print(f"  mAP50: {metrics.box.map50:.3f}")
print(f"  mAP50-95: {metrics.box.map:.3f}")
print(f"  Precision: {metrics.box.mp:.3f}")
print(f"  Recall: {metrics.box.mr:.3f}")

# Show results
from IPython.display import Image, display

results_dir = Path('runs/train/banking_detection')

if (results_dir / 'confusion_matrix.png').exists():
    display(Image(filename=str(results_dir / 'confusion_matrix.png')))

if (results_dir / 'results.png').exists():
    display(Image(filename=str(results_dir / 'results.png')))
```

---

## Cell 6: Download Model

```python
from google.colab import files

# Download best model
model_path = 'runs/train/banking_detection/weights/best.pt'
print(f"Downloading: {model_path}")
files.download(model_path)

print("Download complete! Use this model in your app.")
```

---

## Quick Start

Just copy cells 1-6 into Colab and run them in order. Training takes about 20-30 minutes with free GPU.

After downloading, you'll have `best.pt` - your trained model ready to use!
