"""
Convert YOLOv8 PyTorch model to ONNX format for browser deployment
"""

from ultralytics import YOLO
import sys
from pathlib import Path

def convert_to_onnx(model_path, output_path=None):
    """
    Convert YOLOv8 .pt model to ONNX format
    
    Args:
        model_path: Path to best.pt or banking_model.pt
        output_path: Output path for ONNX file (optional)
    """
    
    model_path = Path(model_path)
    
    if not model_path.exists():
        print(f"Error: Model file not found: {model_path}")
        return False
    
    print(f"Loading model from: {model_path}")
    model = YOLO(str(model_path))
    
    # Set output path
    if output_path is None:
        output_path = model_path.parent / model_path.stem
    else:
        output_path = Path(output_path)
    
    print(f"\nConverting to ONNX format...")
    print(f"Output: {output_path}.onnx")
    
    # Export to ONNX
    model.export(
        format='onnx',
        imgsz=640,
        dynamic=False,
        simplify=True,
        opset=12
    )
    
    # The export creates a file with .onnx extension automatically
    exported_file = model_path.parent / f"{model_path.stem}.onnx"
    
    if exported_file.exists():
        print(f"\n✅ Conversion successful!")
        print(f"📁 ONNX model: {exported_file}")
        print(f"📊 Model size: {exported_file.stat().st_size / 1024 / 1024:.2f} MB")
        print(f"\n💡 Next step: Move {exported_file.name} to your Video_AI/models/ folder")
        return True
    else:
        print(f"\n❌ Conversion failed - output file not found")
        return False


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python convert_to_onnx.py <path_to_best.pt>")
        print("\nExample:")
        print("  python convert_to_onnx.py ../models/best.pt")
        print("  python convert_to_onnx.py best.pt")
        sys.exit(1)
    
    model_path = sys.argv[1]
    
    try:
        success = convert_to_onnx(model_path)
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Error during conversion: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
