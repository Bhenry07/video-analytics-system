# 🎯 Frame Extraction to Custom Model Training - Complete Workflow

## The Process (5 Steps)

### Step 1: Extract Frames (What You Just Did)
**Tool**: Your Video Analytics App  
**Duration**: 5-10 minutes  
**What Happens**: App extracts frames from your video automatically

```
Your Bank Video → Frame Extraction Tool → 500-3000 JPEG Images
```

**You DON'T label anything yet!** Just extract the frames.

---

### Step 2: Upload to Roboflow (Next Step)
**Tool**: Roboflow.com (Free Account)  
**Duration**: 10 minutes  
**What Happens**: Upload all extracted frames

1. Go to https://roboflow.com
2. Create free account
3. Click "Create New Project"
4. Select "Object Detection (Bounding Box)"
5. Name it: `banking-detection-v1`
6. Upload all the frames you just extracted

---

### Step 3: Label Your Objects (THIS IS WHERE YOU "TELL" THE SYSTEM)
**Tool**: Roboflow Labeling Interface  
**Duration**: 10-30 hours (for 1000-5000 images)  
**What Happens**: You draw boxes around objects and give them names

#### Banking Example:

**Frame 1: Customer at ATM**
- Draw box around person → Label it: `customer-at-atm`
- Draw box around ATM machine → Label it: `atm-machine`

**Frame 2: Teller Working**
- Draw box around employee → Label it: `bank-teller`
- Draw box around counter → Label it: `teller-station`

**Frame 3: Customer at Teller**
- Draw box around customer → Label it: `customer-at-teller`
- Draw box around teller → Label it: `bank-teller`
- Draw box around counter → Label it: `teller-station`

#### Your 5 Object Classes for Banking:
1. **bank-teller** - Bank employees
2. **teller-station** - Counter/workstation
3. **customer-at-teller** - Person at teller window
4. **customer-at-atm** - Person using ATM
5. **atm-machine** - The ATM itself

#### Labeling Tips:
- Be consistent with your boxes (include full person head to feet)
- If unsure, don't label it (better to skip than mislabel)
- Label ALL objects in every frame (don't miss any)
- Use keyboard shortcuts in Roboflow (speeds up 10x)

**Time Estimate**:
- Simple frame (1-2 objects): 20 seconds
- Complex frame (5+ objects): 60 seconds
- Average: 30-45 seconds per frame
- **1000 frames ≈ 10-15 hours of labeling**

---

### Step 4: Train the Model (Automated)
**Tool**: Google Colab (Free GPU)  
**Duration**: 2-4 hours (automated)  
**What Happens**: AI learns from your labeled data

1. In Roboflow, click "Generate" → Select "YOLOv8"
2. Copy the API code snippet
3. Open Google Colab: https://colab.research.google.com
4. Paste the training code from `BANKING_MODEL_TRAINING_PLAN.md`
5. Click "Run All"
6. Wait 2-4 hours
7. Download the trained model

**Google Colab does all the hard work!** You just wait.

---

### Step 5: Deploy to Your App
**Tool**: Your Video Analytics App  
**Duration**: 5 minutes  
**What Happens**: Replace default model with your custom model

1. Convert model to TensorFlow.js (command provided in training plan)
2. Copy to `public/models/banking_model/`
3. Update `detection-engine.js` to load custom model
4. Test with new bank videos!

**Result**: Now your app detects YOUR specific objects (tellers, ATMs, customers) with 85%+ accuracy!

---

## Quick Answer to Your Question

> **"How am I going to tell the system what objects do I want it to learn?"**

**Answer**: In Roboflow during Step 3 (Labeling), you:
1. Draw boxes around objects in each frame
2. Type the class name (e.g., "customer-at-atm", "bank-teller")
3. Repeat for all objects in all frames
4. The AI learns from these labels during training

**The extraction step doesn't need to know** what objects you want - it just captures all the frames. You tell it what to learn AFTER extraction, during labeling.

---

## Example Workflow Timeline

### Week 1: Data Collection
- **Monday**: Extract frames from 5 bank videos → ~5,000 frames
- **Tuesday**: Upload to Roboflow, start labeling
- **Wed-Fri**: Continue labeling (~15 hours total)

### Week 2: Training & Deployment
- **Monday**: Finish labeling, generate dataset in Roboflow
- **Tuesday**: Train model in Google Colab (4 hours automated)
- **Wednesday**: Convert and deploy to app
- **Thursday**: Test and refine
- **Friday**: Production ready!

---

## What You Have Now

✅ **Frame Extraction Tool** - Extracts frames from any video  
✅ **~3505 frames** extracted from your ATM video (if it completes successfully)  
✅ **Training Plan** - Step-by-step guide in `BANKING_MODEL_TRAINING_PLAN.md`

## What You Need Next

1. ⏳ **Wait for extraction to complete** (should extract all 3505 frames)
2. ⏳ **Create Roboflow account**
3. ⏳ **Upload frames to Roboflow**
4. ⏳ **Start labeling** (this is where you "teach" the AI)

---

## Common Questions

### Q: Do I need to label ALL 3505 frames?
**A**: No! For banking, aim for:
- Minimum: 500 frames (100 per class) - Quick training
- Recommended: 1500-2000 frames (300-400 per class) - Good accuracy
- Ideal: 3000+ frames (600+ per class) - Excellent accuracy

Pick the best frames (varied angles, lighting, scenarios).

### Q: How long does labeling take?
**A**: 
- 500 frames = 5-8 hours
- 1500 frames = 15-20 hours
- 3000 frames = 30-40 hours

You can label in batches (1-2 hours per day).

### Q: Can multiple people label?
**A**: Yes! Roboflow supports team labeling. Divide work among 2-3 people to finish faster.

### Q: What if I make mistakes labeling?
**A**: You can edit/delete labels in Roboflow anytime before generating the dataset.

### Q: Can I add more classes later?
**A**: Yes! You can retrain with additional classes. Start with 3-5 core classes, add more later.

---

## Next Immediate Steps

1. **Check if all 3505 frames extracted** (look in browser console or check stats)
2. **If only 1 frame extracted** → Refresh page and try again with fixes I just made
3. **Once frames extracted** → Download them or view in console
4. **Create Roboflow account**: https://roboflow.com
5. **Upload frames to new project**
6. **Start labeling first 100 frames** to get comfortable

---

## Need Help?

**During Extraction**: Check browser console (F12) for errors  
**During Labeling**: Roboflow has built-in tutorials  
**During Training**: Training plan has troubleshooting section  
**During Deployment**: I can help integrate the model  

---

**Remember**: The extraction doesn't need to know what objects you want. That happens during labeling in Roboflow. The extraction just captures all the frames so you have data to label!
