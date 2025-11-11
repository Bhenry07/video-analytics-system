# 🎨 Frame Extraction Controls - User Guide

## What Each Control Does

### ⚡ Extraction Rate (FPS Slider)
**What it does**: Controls how many frames to extract per second of video

**Settings**:
- **0.1 fps** = 1 frame every 10 seconds (very slow, fewer images)
- **0.5 fps** = 1 frame every 2 seconds ⭐ **RECOMMENDED for training**
- **1.0 fps** = 1 frame every second (lots of images)
- **5.0 fps** = 5 frames every second (maximum, very many images)

**When to use**:
- **0.1-0.3 fps**: Static scenes (security cameras), saves storage
- **0.5 fps**: ⭐ **Best for training data** - good variety without too many duplicates
- **1.0-2.0 fps**: Action scenes, fast movement
- **3.0-5.0 fps**: Detailed action analysis, sports

**Example**:
- 10 minute video at 0.5 fps = 300 frames
- 10 minute video at 1.0 fps = 600 frames

---

### 🎨 Image Quality Slider
**What it does**: Controls JPEG compression quality

**Settings**:
- **50-70%**: Low quality, smaller files (not recommended for training)
- **80-90%**: Good quality, reasonable file size
- **95%**: ⭐ **RECOMMENDED** - High quality, slightly larger files
- **100%**: Maximum quality, largest files

**When to use**:
- **95%**: ⭐ **Best for AI training** - high quality without massive files
- **80-90%**: Web upload, storage limited
- **100%**: Print quality, maximum detail

---

### 🔄 Skip Similar Frames
**What it does**: Compares each frame to the previous one. If they're >98.5% identical, skips the duplicate.

#### ❌ UNCHECKED (Recommended for Most Cases)
- Extracts ALL frames at your chosen rate
- No skipping, even if frames look similar
- **Use when**: 
  - ✅ Training AI models (you want variety!)
  - ✅ Moving objects/people in scene
  - ✅ ATM/banking videos (people come and go)
  - ✅ Parking lot footage (cars moving)

#### ✅ CHECKED (Only for Very Static Scenes)
- Skips frames that are 98.5%+ identical
- Saves storage space
- **Use when**:
  - ✅ Empty scene for long periods (overnight security footage)
  - ✅ Fixed camera, no movement for minutes
  - ✅ You want to save disk space
  - ❌ **DON'T USE** for training data (you'll lose frames!)

**Example**:
- **ATM Video with person**: Unchecked ❌ = Get frames of person approaching, using ATM, leaving
- **ATM Video with person**: Checked ✅ = Might skip frames where person is standing still

**Why it was causing problems**: Your ATM video has a person in some frames, but the camera and ATM are static. The algorithm was comparing the ENTIRE frame (including background), not just the person. Since 98% of the frame (building, ATM, sky) didn't change, it thought the frames were "duplicates" and skipped them!

---

### 📁 Auto-Organize by Time Period
**What it does**: Groups extracted frames into folders based on time of day

#### ✅ CHECKED (Recommended)
- Organizes frames into 5 categories:
  - **morning_rush** (7am-10am) - Busy time, lots of customers
  - **midday** (10am-2pm) - Normal traffic
  - **afternoon** (2pm-5pm) - Steady activity
  - **evening_rush** (5pm-8pm) - Peak time
  - **night** (8pm+) - Low activity
- **Benefits**:
  - Easy to see distribution across time periods
  - Can train AI to recognize time-of-day patterns
  - Helps balance training data (not all morning shots)

#### ❌ UNCHECKED
- All frames in one flat list
- Numbered sequentially: `frame_0001.jpg`, `frame_0002.jpg`, etc.
- Use if you don't care about time periods

**Example Output Structure**:
```
With Auto-Organize ✅:
morning_rush_frame_0001.jpg
morning_rush_frame_0002.jpg
midday_frame_0001.jpg
afternoon_frame_0001.jpg
evening_rush_frame_0001.jpg

Without Auto-Organize ❌:
frame_0001.jpg
frame_0002.jpg
frame_0003.jpg
```

---

## 🎯 Recommended Settings for Banking Training Data

### Best Configuration:
- **Extraction Rate**: 0.5 fps ⭐
- **Quality**: 95% ⭐
- **Skip Similar Frames**: ❌ **UNCHECKED**
- **Auto-Organize**: ✅ **CHECKED**

### Why These Settings:
- **0.5 fps**: Captures variety without too many near-duplicates
- **95% quality**: High enough for AI training, not wasteful
- **Skip OFF**: Ensures you don't miss important frames with people
- **Auto-Organize ON**: Helps you see time distribution, balance training data

### Expected Results (10 minute banking video):
- **Total Frames**: ~300 frames
- **File Size**: ~50-80 MB total
- **Distribution**:
  - morning_rush: 60 frames (if video starts at 9am)
  - midday: 150 frames
  - afternoon: 90 frames
  - evening_rush: 0 frames (if video ends at 3pm)

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Leaving "Skip Similar Frames" Checked
**Problem**: Your ATM video is mostly static, so almost every frame gets skipped  
**Result**: Only 1-2 frames extracted instead of 300  
**Fix**: Uncheck the box ❌

### ❌ Mistake 2: Using 5.0 fps for Training Data
**Problem**: Extracts too many near-identical frames (5 per second!)  
**Result**: 3000 frames that mostly look the same, wastes time labeling  
**Fix**: Use 0.5 fps instead

### ❌ Mistake 3: Using 50% Quality
**Problem**: AI training needs high-quality images to learn details  
**Result**: Blurry images = poor AI accuracy  
**Fix**: Use 95% quality

---

## 📊 Quick Comparison

| Scenario | Extraction Rate | Skip Similar | Why |
|----------|----------------|--------------|-----|
| **Banking/ATM Training** | 0.5 fps | ❌ OFF | People move, want all frames |
| **Empty overnight footage** | 0.1 fps | ✅ ON | Nothing happens, save space |
| **Sports action** | 1-2 fps | ❌ OFF | Fast movement, need detail |
| **Parking lot monitoring** | 0.5 fps | ❌ OFF | Cars come/go |
| **Fixed empty scene** | 0.1 fps | ✅ ON | Static, waste of space |

---

## 🎨 New Visual Features

### What's New:
- ✅ **Gradient card backgrounds** - Purple gradient theme
- ✅ **Animated sliders** - Smooth hover effects
- ✅ **Custom checkboxes** - Purple checkmarks with descriptions
- ✅ **Dynamic hints** - Updates as you move sliders
- ✅ **Hover effects** - Cards lift on hover
- ✅ **Icons for clarity** - Visual indicators for each setting
- ✅ **Descriptions** - Each option explains what it does

### How to See It:
1. Hard refresh page: `Ctrl + Shift + R`
2. Look at Frame Extraction Tool section
3. Hover over cards to see animations
4. Move sliders to see smooth transitions

---

## ❓ Still Confused?

**Q: Why only 1 frame extracted?**  
A: "Skip Similar Frames" was checked, marking almost everything as duplicate

**Q: Should I check "Skip Similar Frames"?**  
A: **NO** ❌ - Not for training data with people/movement

**Q: What's the best extraction rate?**  
A: **0.5 fps** - Perfect balance for training data

**Q: How many frames do I need for training?**  
A: **500-2000 frames minimum** (100-400 per class)

---

**Last Updated**: November 10, 2025  
**Status**: UI redesigned with purple gradient theme and helpful descriptions
