import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|avi|mov|mkv|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 * 1024 } // 5GB limit
});

// Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static(uploadsDir));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// API Routes
app.post('/api/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file uploaded' });
  }

  res.json({
    success: true,
    filename: req.file.filename,
    originalname: req.file.originalname,
    size: req.file.size,
    path: `/uploads/${req.file.filename}`
  });
});

app.get('/api/videos', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read videos' });
    }

    const videos = files
      .filter((file) => /\.(mp4|avi|mov|mkv|webm)$/i.test(file))
      .map((file) => {
        const stats = fs.statSync(path.join(uploadsDir, file));
        return {
          filename: file,
          path: `/uploads/${file}`,
          size: stats.size,
          uploadedAt: stats.mtime
        };
      })
      .sort((a, b) => b.uploadedAt - a.uploadedAt);

    res.json(videos);
  });
});

app.delete('/api/videos/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);

  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json({ success: true, message: 'Video deleted' });
  });
});

app.listen(PORT, () => {
  console.log(`\n🎥 Video Analytics Server Running!`);
  console.log(`\n📡 Access the app at: http://localhost:${PORT}`);
  console.log(`\n📁 Uploads directory: ${uploadsDir}\n`);
});
