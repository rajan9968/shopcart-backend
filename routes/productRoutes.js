import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  resetProducts
} from '../controllers/productController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage for product images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `product-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 } // 12MB limit
});

const router = express.Router();

// GET /api/products - Get all products (query: ?category=..., ?search=..., ?status=...)
router.get('/', getProducts);

// POST /api/products/upload - Upload product photo
router.post('/upload', upload.single('file'), uploadProductImage);

// POST /api/products/reset - Reset to default catalog
router.post('/reset', resetProducts);

// GET /api/products/:id - Get single product
router.get('/:id', getProductById);

// POST /api/products - Create new product
router.post('/', createProduct);

// PUT /api/products/:id - Update product
router.put('/:id', updateProduct);

// DELETE /api/products/:id - Delete product
router.delete('/:id', deleteProduct);

export default router;
