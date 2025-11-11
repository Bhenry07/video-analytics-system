"""
Flask API for YOLOv8 Detection
Server-side detection using custom trained banking model
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
from PIL import Image
import io
import base64
import time
import os
from pathlib import Path

app = Flask(__name__)
CORS(app)  # Enable CORS for browser requests

# Find model file
model_path = Path(__file__).parent.parent / 'models' / 'banking_model.pt'
if not model_path.exists():
    model_path = Path(__file__).parent.parent / 'models' / 'best.pt'

print(f"Loading YOLOv8 model from: {model_path}")
if not model_path.exists():
    print(f"ERROR: Model file not found at {model_path}")
    print("Please ensure banking_model.pt or best.pt is in the models/ folder")
    exit(1)

model = YOLO(str(model_path))
print(f"✅ Model loaded successfully!")
print(f"Classes: {list(model.names.values())}")

@app.route('/detect', methods=['POST'])
def detect():
    """
    Detect objects in image
    Expects: JSON with base64 encoded image
    Returns: JSON with detections
    """
    try:
        data = request.json
        image_data = data['image'].split(',')[1]  # Remove data:image/jpeg;base64,
        
        # Decode image
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Run detection
        results = model(image, conf=0.5)
        
        # Format results
        detections = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                detections.append({
                    'class': result.names[int(box.cls[0])],
                    'score': float(box.conf[0]),
                    'bbox': [x1, y1, x2 - x1, y2 - y1]  # [x, y, width, height]
                })
        
        return jsonify({
            'success': True,
            'detections': detections,
            'count': len(detections)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model': 'YOLOv8 Banking Detection',
        'classes': model.names
    })

if __name__ == '__main__':
    print("\n🚀 YOLOv8 Detection API Running!")
    print("📡 Endpoint: http://localhost:5000/detect")
    print("💚 Health check: http://localhost:5000/health\n")
    app.run(host='0.0.0.0', port=5000, debug=False)
