import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getSettings, updateSettings, uploadImage } from '../controllers/settingsController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const prefix = (req.body.type || 'upload').replace(/[^a-z0-9]/gi, '');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${prefix}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max limit
});

const router = express.Router();

// GET /api/settings - Read site settings
router.get('/', getSettings);

// PUT /api/settings - Update site settings
router.put('/', updateSettings);

// POST /api/settings - Update site settings
router.post('/', updateSettings);

// POST /api/settings/upload - Upload logo or favicon image
router.post('/upload', upload.single('file'), uploadImage);

export default router;
