import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  uploadBannerImage,
  reorderBanners
} from '../controllers/bannerController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage for banners
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `hero-banner-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit for high-res hero banners
});

const router = express.Router();

// GET /api/banners - List all banners (filter with ?status=active)
router.get('/', getBanners);

// GET /api/banners/:id - Get single banner
router.get('/:id', getBannerById);

// POST /api/banners - Create new banner
router.post('/', createBanner);

// PUT /api/banners/reorder - Reorder banners
router.put('/reorder', reorderBanners);

// PUT /api/banners/:id - Update banner
router.put('/:id', updateBanner);

// DELETE /api/banners/:id - Delete banner
router.delete('/:id', deleteBanner);

// POST /api/banners/upload - Upload hero banner image
router.post('/upload', upload.single('file'), uploadBannerImage);

export default router;
