"""
YOLOv8 Training Script
Train custom object detection model on banking/ATM dataset
"""

from ultralytics import YOLO
import torch
from pathlib import Path
import yaml

def train_model(
    data_yaml='training_data/dataset.yaml',
    model_size='n',  # n (nano), s (small), m (medium), l (large), x (xlarge)
    epochs=100,
    batch_size=16,
    img_size=640,
    device='',  # '' = auto-select, 'cpu', '0' (GPU 0), '0,1' (multi-GPU)
    project='runs/train',
    name='banking_detection'
):
    """
    Train YOLOv8 model
    
    Args:
        data_yaml: Path to dataset.yaml
        model_size: Model size (n, s, m, l, x)
        epochs: Number of training epochs
        batch_size: Batch size
        img_size: Input image size
        device: Device to use (auto, cpu, or gpu)
        project: Project directory
        name: Experiment name
    """
    
    print("🚀 Starting YOLOv8 Training")
    print("="*60)
    
    # Check if dataset.yaml exists
    data_path = Path(data_yaml)
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset config not found: {data_yaml}")
    
    # Load dataset info
    with open(data_path, 'r') as f:
        dataset_config = yaml.safe_load(f)
    
    num_classes = len(dataset_config['names'])
    class_names = list(dataset_config['names'].values())
    
    print(f"📊 Dataset: {data_path.absolute()}")
    print(f"🏷️  Classes ({num_classes}): {', '.join(class_names)}")
    
    # Check CUDA availability
    if device == '':
        device = '0' if torch.cuda.is_available() else 'cpu'
    
    print(f"💻 Device: {device}")
    if device != 'cpu' and torch.cuda.is_available():
        print(f"   GPU: {torch.cuda.get_device_name(0)}")
        print(f"   CUDA Version: {torch.version.cuda}")
        print(f"   Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
    
    # Load pretrained YOLOv8 model
    model_name = f'yolov8{model_size}.pt'
    print(f"\n🔄 Loading pretrained model: {model_name}")
    model = YOLO(model_name)
    
    print(f"\n🎯 Training configuration:")
    print(f"   Epochs: {epochs}")
    print(f"   Batch size: {batch_size}")
    print(f"   Image size: {img_size}x{img_size}")
    print(f"   Model: YOLOv8{model_size.upper()}")
    
    # Calculate estimated time
    print(f"\n⏱️  Estimated training time:")
    if device == 'cpu':
        print(f"   ~{epochs * 2} minutes (CPU is slow, consider using GPU)")
    else:
        print(f"   ~{epochs * 0.3:.0f} minutes with GPU")
    
    print("\n" + "="*60)
    print("🎬 Starting training... (Press Ctrl+C to stop)")
    print("="*60 + "\n")
    
    # Train the model
    results = model.train(
        data=str(data_path),
        epochs=epochs,
        imgsz=img_size,
        batch=batch_size,
        device=device,
        project=project,
        name=name,
        pretrained=True,
        optimizer='auto',
        verbose=True,
        seed=42,
        deterministic=True,
        single_cls=False,
        rect=False,
        cos_lr=False,
        close_mosaic=10,
        resume=False,
        amp=True,  # Automatic Mixed Precision
        fraction=1.0,
        profile=False,
        # Data augmentation
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=0.0,
        translate=0.1,
        scale=0.5,
        shear=0.0,
        perspective=0.0,
        flipud=0.0,
        fliplr=0.5,
        mosaic=1.0,
        mixup=0.0,
        copy_paste=0.0
    )
    
    print("\n" + "="*60)
    print("✅ Training completed!")
    print("="*60)
    
    # Validate model
    print("\n📊 Running validation...")
    metrics = model.val()
    
    print(f"\n🎯 Results:")
    print(f"   mAP50: {metrics.box.map50:.3f}")
    print(f"   mAP50-95: {metrics.box.map:.3f}")
    print(f"   Precision: {metrics.box.mp:.3f}")
    print(f"   Recall: {metrics.box.mr:.3f}")
    
    # Export model
    print("\n📦 Exporting model...")
    
    # Get the best model path
    best_model_path = Path(project) / name / 'weights' / 'best.pt'
    
    # Export to different formats
    export_formats = ['onnx', 'torchscript']
    
    for fmt in export_formats:
        try:
            print(f"   Exporting to {fmt.upper()}...")
            model.export(format=fmt)
            print(f"   ✅ {fmt.upper()} export successful")
        except Exception as e:
            print(f"   ⚠️  {fmt.upper()} export failed: {e}")
    
    print("\n" + "="*60)
    print("🎉 All done!")
    print("="*60)
    print(f"\n📁 Model saved to: {best_model_path}")
    print(f"📊 Training results: {Path(project) / name}")
    print(f"\n🔮 To use your model:")
    print(f"   from ultralytics import YOLO")
    print(f"   model = YOLO('{best_model_path}')")
    print(f"   results = model('image.jpg')")
    print("\n💡 Next step: Integrate this model into your Video Analytics app!")
    print("="*60)
    
    return model, results, metrics


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Train YOLOv8 on custom dataset')
    parser.add_argument('--data', type=str, default='training_data/dataset.yaml',
                        help='Path to dataset.yaml')
    parser.add_argument('--model', type=str, default='n', choices=['n', 's', 'm', 'l', 'x'],
                        help='Model size: n (fastest), s, m, l, x (most accurate)')
    parser.add_argument('--epochs', type=int, default=100,
                        help='Number of training epochs')
    parser.add_argument('--batch', type=int, default=16,
                        help='Batch size')
    parser.add_argument('--img-size', type=int, default=640,
                        help='Input image size')
    parser.add_argument('--device', type=str, default='',
                        help='Device: "" (auto), "cpu", "0" (GPU 0), "0,1" (multi-GPU)')
    parser.add_argument('--name', type=str, default='banking_detection',
                        help='Experiment name')
    
    args = parser.parse_args()
    
    try:
        train_model(
            data_yaml=args.data,
            model_size=args.model,
            epochs=args.epochs,
            batch_size=args.batch,
            img_size=args.img_size,
            device=args.device,
            name=args.name
        )
    except KeyboardInterrupt:
        print("\n\n⚠️  Training interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
