import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection, initMenuTable, initSettingsTable, initBannersTable, initProductsTable } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import productRoutes from './routes/productRoutes.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = Number(process.env.PORT) || 5001;

// Enable CORS for frontend
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
  ],
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/products', productRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Their Nibs / Ecom Backend API'
  });
});

// Root welcome endpoint
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; padding: 40px; text-align: center;">
      <h1 style="color: #BA6C5A;">Their Nibs Ecom Backend API</h1>
      <p>Node.js + Express + MySQL API is running smoothly on port ${PORT}.</p>
      <p>Database: <code>${process.env.DB_NAME || 'ecomdb'}</code> (phpMyAdmin)</p>
      <div style="margin-top: 20px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
        <a href="/api/health" style="background-color: #BA6C5A; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px;">Check API Health</a>
        <a href="/api/products" style="background-color: #BA6C5A; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px;">View Dynamic Products API</a>
        <a href="/api/menu" style="background-color: #1E2328; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px;">View Dynamic Menu Tree</a>
        <a href="/api/banners" style="background-color: #BA6C5A; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px;">View Hero Banners</a>
      </div>
    </div>
  `);
});

// Start Server
app.listen(PORT, async () => {
  console.log(`===============================================`);
  console.log(`🚀 Backend Server running on: http://localhost:${PORT}`);
  console.log(`📡 Database: MySQL (${process.env.DB_NAME || 'ecomdb'})`);
  console.log(`👗 Products API: http://localhost:${PORT}/api/products`);
  console.log(`📋 Menu API: http://localhost:${PORT}/api/menu`);
  console.log(`⚙️  Settings API: http://localhost:${PORT}/api/settings`);
  console.log(`🖼️  Banners API: http://localhost:${PORT}/api/banners`);
  console.log(`===============================================`);
  
  // Test MySQL connection
  const dbOk = await testConnection();
  if (dbOk) {
    // Initialize & seed website_menus table in MySQL
    await initMenuTable();
    // Initialize & seed site_settings table in MySQL
    await initSettingsTable();
    // Initialize & seed hero_banners table in MySQL
    await initBannersTable();
    // Initialize & seed products table in MySQL
    await initProductsTable();
  }
});


