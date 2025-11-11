"""
Dataset Preparation Script
Organizes exported ZIP data into YOLOv8 training format
"""

import os
import shutil
import random
from pathlib import Path
import zipfile

def prepare_dataset(zip_path, output_dir='training_data'):
    """
    Prepare dataset from exported ZIP file
    
    Args:
        zip_path: Path to exported banking_dataset_*.zip
        output_dir: Directory to create organized dataset
    """
    
    print("🚀 Starting dataset preparation...")
    
    # Create output directories
    base_path = Path(output_dir)
    
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
    
    print(f"✅ Created directory structure in {base_path}")
    
    # Extract ZIP file
    temp_extract = base_path / 'temp_extract'
    temp_extract.mkdir(exist_ok=True)
    
    print(f"📦 Extracting {zip_path}...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(temp_extract)
    
    # Find extracted folders
    images_dir = temp_extract / 'images'
    annotations_dir = temp_extract / 'annotations'
    
    if not images_dir.exists() or not annotations_dir.exists():
        raise Exception(f"Could not find images/ and annotations/ in ZIP file")
    
    # Get all image files
    image_files = list(images_dir.glob('*.jpg'))
    print(f"📸 Found {len(image_files)} images")
    
    # Shuffle and split dataset (80% train, 15% val, 5% test)
    random.seed(42)  # For reproducibility
    random.shuffle(image_files)
    
    total = len(image_files)
    train_split = int(0.8 * total)
    val_split = int(0.95 * total)
    
    train_files = image_files[:train_split]
    val_files = image_files[train_split:val_split]
    test_files = image_files[val_split:]
    
    print(f"📊 Split: {len(train_files)} train, {len(val_files)} val, {len(test_files)} test")
    
    # Copy files to appropriate directories
    def copy_split(files, img_dir, label_dir):
        for img_file in files:
            # Copy image
            shutil.copy2(img_file, img_dir / img_file.name)
            
            # Copy corresponding annotation
            label_file = annotations_dir / img_file.with_suffix('.txt').name
            if label_file.exists():
                shutil.copy2(label_file, label_dir / label_file.name)
    
    print("📂 Copying files...")
    copy_split(train_files, dirs['train_images'], dirs['train_labels'])
    copy_split(val_files, dirs['val_images'], dirs['val_labels'])
    copy_split(test_files, dirs['test_images'], dirs['test_labels'])
    
    # Copy classes.txt
    classes_file = temp_extract / 'classes.txt'
    if classes_file.exists():
        shutil.copy2(classes_file, base_path / 'classes.txt')
        
        # Read class names
        with open(classes_file, 'r') as f:
            class_names = [line.strip() for line in f.readlines()]
    else:
        class_names = ['person', 'car', 'truck', 'handbag', 'backpack', 'bottle', 'cell phone']
    
    print(f"🏷️  Classes: {', '.join(class_names)}")
    
    # Create dataset.yaml for YOLOv8
    yaml_content = f"""# Banking Detection Dataset
path: {base_path.absolute()}
train: images/train
val: images/val
test: images/test

# Classes
names:
"""
    
    for idx, class_name in enumerate(class_names):
        yaml_content += f"  {idx}: {class_name}\n"
    
    yaml_path = base_path / 'dataset.yaml'
    with open(yaml_path, 'w') as f:
        f.write(yaml_content)
    
    print(f"✅ Created {yaml_path}")
    
    # Clean up temp directory
    shutil.rmtree(temp_extract)
    print("🧹 Cleaned up temporary files")
    
    # Print summary
    print("\n" + "="*60)
    print("✨ Dataset preparation complete!")
    print("="*60)
    print(f"📁 Dataset location: {base_path.absolute()}")
    print(f"📊 Total images: {total}")
    print(f"   - Training: {len(train_files)} ({len(train_files)/total*100:.1f}%)")
    print(f"   - Validation: {len(val_files)} ({len(val_files)/total*100:.1f}%)")
    print(f"   - Testing: {len(test_files)} ({len(test_files)/total*100:.1f}%)")
    print(f"🏷️  Classes: {len(class_names)}")
    print(f"📄 Config file: {yaml_path}")
    print("\n🎯 Ready for training! Run: python train_model.py")
    print("="*60)
    
    return base_path, yaml_path


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python prepare_dataset.py <path_to_exported_zip>")
        print("\nExample:")
        print("  python prepare_dataset.py ../banking_dataset_1234567890.zip")
        sys.exit(1)
    
    zip_path = sys.argv[1]
    
    if not os.path.exists(zip_path):
        print(f"❌ Error: ZIP file not found: {zip_path}")
        sys.exit(1)
    
    try:
        prepare_dataset(zip_path)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
