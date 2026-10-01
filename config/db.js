import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Create MySQL connection pool
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecomdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection function
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[MySQL] Successfully connected to database: ${process.env.DB_NAME || 'ecomdb'}`);
    connection.release();
    return true;
  } catch (error) {
    console.error(`[MySQL] Connection error:`, error.message);
    console.error(`[MySQL Hint] Make sure MySQL is running in phpMyAdmin / XAMPP on port ${process.env.DB_PORT || 3306} and database '${process.env.DB_NAME || 'ecomdb'}' exists.`);
    return false;
  }
}

// Ensure website_menus table exists without forcing default seeds
export async function initMenuTable() {
  try {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS \`website_menus\` (
        \`id\` INT(11) NOT NULL AUTO_INCREMENT,
        \`title\` VARCHAR(255) NOT NULL,
        \`url\` VARCHAR(255) NOT NULL DEFAULT '/',
        \`parent_id\` INT(11) DEFAULT NULL,
        \`order_index\` INT(11) DEFAULT 0,
        \`status\` VARCHAR(50) DEFAULT 'active',
        \`badge\` VARCHAR(50) DEFAULT NULL,
        \`target\` VARCHAR(20) DEFAULT '_self',
        \`created\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updated\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`parent_id\` (\`parent_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `;
    await pool.query(createTableSql);
    console.log('[MySQL] website_menus table checked & ready.');
  } catch (error) {
    console.error('[MySQL] initMenuTable error:', error.message);
  }
}

// Ensure site_settings table exists and has default row
export async function initSettingsTable() {
  try {
    const createSettingsTableSql = `
      CREATE TABLE IF NOT EXISTS \`site_settings\` (
        \`id\` INT(11) NOT NULL AUTO_INCREMENT,
        \`site_name\` VARCHAR(255) NOT NULL DEFAULT 'Their Nibs London',
        \`site_tagline\` VARCHAR(255) DEFAULT 'Luxury Pyjamas, Nightwear & Loungewear',
        \`logo_url\` TEXT DEFAULT NULL,
        \`favicon_url\` TEXT DEFAULT NULL,
        \`email\` VARCHAR(255) DEFAULT 'support@theirnibs.com',
        \`phone\` VARCHAR(100) DEFAULT '+44 (0) 20 8123 4567',
        \`whatsapp\` VARCHAR(100) DEFAULT '+44 7123 456789',
        \`address\` TEXT DEFAULT NULL,
        \`city\` VARCHAR(100) DEFAULT 'London',
        \`postal_code\` VARCHAR(50) DEFAULT 'W4 5PY',
        \`country\` VARCHAR(100) DEFAULT 'United Kingdom',
        \`facebook\` VARCHAR(255) DEFAULT 'https://facebook.com/theirnibs',
        \`instagram\` VARCHAR(255) DEFAULT 'https://instagram.com/theirnibs',
        \`twitter\` VARCHAR(255) DEFAULT 'https://twitter.com/theirnibs',
        \`pinterest\` VARCHAR(255) DEFAULT 'https://pinterest.com/theirnibs',
        \`tiktok\` VARCHAR(255) DEFAULT 'https://tiktok.com/@theirnibs',
        \`youtube\` VARCHAR(255) DEFAULT 'https://youtube.com/@theirnibs',
        \`copyright_text\` VARCHAR(255) DEFAULT '© 2026 Their Nibs London. All Rights Reserved.',
        \`created\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updated\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `;
    await pool.query(createSettingsTableSql);

    // Check if any settings exist; if not, insert defaults
    const [rows] = await pool.query('SELECT id FROM site_settings LIMIT 1');
    if (rows.length === 0) {
      const defaultInsertSql = `
        INSERT INTO \`site_settings\` (
          \`id\`, \`site_name\`, \`site_tagline\`, \`logo_url\`, \`favicon_url\`, 
          \`email\`, \`phone\`, \`whatsapp\`, \`address\`, \`city\`, \`postal_code\`, 
          \`country\`, \`facebook\`, \`instagram\`, \`twitter\`, \`pinterest\`, 
          \`tiktok\`, \`youtube\`, \`copyright_text\`
        ) VALUES (
          1,
          'Their Nibs London',
          'Luxury Pyjamas, Nightwear & Loungewear',
          'https://www.theirnibs.com/cdn/shop/files/TheirNibs_Logo_Navy_Wide.png',
          'https://www.theirnibs.com/cdn/shop/files/TheirNibs_Logo_Navy_Wide.png',
          'support@theirnibs.com',
          '+44 (0) 20 8123 4567',
          '+44 7123 456789',
          'Studio 14, The Light Box, 111 Power Road, London, W4 5PY, United Kingdom',
          'London',
          'W4 5PY',
          'United Kingdom',
          'https://facebook.com/theirnibs',
          'https://instagram.com/theirnibs',
          'https://twitter.com/theirnibs',
          'https://pinterest.com/theirnibs',
          'https://tiktok.com/@theirnibs',
          'https://youtube.com/@theirnibs',
          '© 2026 Their Nibs London. All Rights Reserved.'
        );
      `;
      await pool.query(defaultInsertSql);
      console.log('[MySQL] site_settings table created and initialized with default boutique settings.');
    } else {
      console.log('[MySQL] site_settings table checked & ready.');
    }
  } catch (error) {
    console.error('[MySQL] initSettingsTable error:', error.message);
  }
}

// Ensure hero_banners table exists and has default slides
export async function initBannersTable() {
  try {
    const createBannersTableSql = `
      CREATE TABLE IF NOT EXISTS \`hero_banners\` (
        \`id\` INT(11) NOT NULL AUTO_INCREMENT,
        \`title\` VARCHAR(255) NOT NULL,
        \`subtitle\` TEXT DEFAULT NULL,
        \`image_url\` TEXT NOT NULL,
        \`mobile_image_url\` TEXT DEFAULT NULL,
        \`cta_text\` VARCHAR(100) DEFAULT 'SHOP NOW',
        \`cta_link\` VARCHAR(255) DEFAULT '/collections',
        \`badge\` VARCHAR(100) DEFAULT NULL,
        \`order_index\` INT(11) DEFAULT 0,
        \`status\` VARCHAR(50) DEFAULT 'active',
        \`created\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updated\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `;
    await pool.query(createBannersTableSql);

    // Check if banners exist; if not, seed default slides
    const [rows] = await pool.query('SELECT id FROM hero_banners LIMIT 1');
    if (rows.length === 0) {
      const defaultBannersSql = `
        INSERT INTO \`hero_banners\` (
          \`title\`, \`subtitle\`, \`image_url\`, \`cta_text\`, \`cta_link\`, \`badge\`, \`order_index\`, \`status\`
        ) VALUES 
        (
          'Women\\'s Pyjama Sets',
          'Shop New In Nightwear',
          'https://www.theirnibs.com/cdn/shop/files/Screenshot_2026-07-14_at_15.14.40.png',
          'SHOP NOW',
          '#featured-products',
          'NEW IN',
          1,
          'active'
        ),
        (
          'Dressing Gowns & Robes',
          'Effortless lightweight cotton & elegant hand-painted floral prints',
          'https://www.theirnibs.com/cdn/shop/files/Wisteria_Robe_Hero_banner.jpg',
          'SHOP ROBES',
          '#featured-products',
          'SIGNATURE',
          2,
          'active'
        ),
        (
          'Their Nibs x Sophie Ellis-Bextor',
          'Exclusive Disco Glamour & Playful Hand-Drawn Vintage Prints',
          'https://www.theirnibs.com/cdn/shop/files/Transitional_new_In.jpg',
          'DISCOVER THE COLLAB',
          '#featured-products',
          'EXCLUSIVE',
          3,
          'active'
        );
      `;
      await pool.query(defaultBannersSql);
      console.log('[MySQL] hero_banners table created and seeded with default slides.');
    } else {
      console.log('[MySQL] hero_banners table checked & ready.');
    }
  } catch (error) {
    console.error('[MySQL] initBannersTable error:', error.message);
  }
}

// Ensure products table exists and seed with store catalog if empty
export async function initProductsTable() {
  try {
    const createProductsTableSql = `
      CREATE TABLE IF NOT EXISTS \`products\` (
        \`id\` BIGINT(20) NOT NULL AUTO_INCREMENT,
        \`title\` VARCHAR(255) NOT NULL,
        \`handle\` VARCHAR(255) DEFAULT NULL,
        \`category\` VARCHAR(100) DEFAULT 'Womens',
        \`price_gbp\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        \`compare_at_price_gbp\` DECIMAL(10,2) DEFAULT NULL,
        \`rating\` DECIMAL(3,1) DEFAULT 4.8,
        \`review_count\` INT(11) DEFAULT 0,
        \`is_bestseller\` TINYINT(1) DEFAULT 0,
        \`is_new\` TINYINT(1) DEFAULT 0,
        \`tag\` VARCHAR(100) DEFAULT NULL,
        \`images\` LONGTEXT DEFAULT NULL,
        \`description\` LONGTEXT DEFAULT NULL,
        \`sizes\` LONGTEXT DEFAULT NULL,
        \`details\` LONGTEXT DEFAULT NULL,
        \`stock\` INT(11) DEFAULT 25,
        \`status\` VARCHAR(50) DEFAULT 'active',
        \`created\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updated\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`category\` (\`category\`),
        KEY \`status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `;
    await pool.query(createProductsTableSql);

    // Check if products exist
    const [rows] = await pool.query('SELECT id FROM products LIMIT 1');
    if (rows.length === 0) {
      console.log('[MySQL] Seeding products table from initial catalog...');
      const { PRODUCTS } = await import('../data/initialProducts.js');

      if (Array.isArray(PRODUCTS) && PRODUCTS.length > 0) {
        for (const item of PRODUCTS) {
          const insertSql = `
            INSERT INTO \`products\` (
              \`id\`, \`title\`, \`handle\`, \`category\`, \`price_gbp\`,
              \`rating\`, \`review_count\`, \`is_bestseller\`, \`is_new\`,
              \`tag\`, \`images\`, \`description\`, \`sizes\`, \`details\`, \`stock\`, \`status\`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          await pool.query(insertSql, [
            item.id || null,
            item.title || 'Untitled Product',
            item.handle || (item.title ? item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 'product'),
            item.category || 'Womens',
            Number(item.priceGBP) || 45.00,
            parseFloat(item.rating) || 4.8,
            Number(item.reviewCount) || 12,
            item.isBestseller ? 1 : 0,
            item.isNew ? 1 : 0,
            item.tag || (item.isBestseller ? 'BESTSELLER' : item.isNew ? 'NEW' : null),
            JSON.stringify(Array.isArray(item.images) ? item.images : (item.image ? [item.image] : [])),
            item.description || '',
            JSON.stringify(Array.isArray(item.sizes) ? item.sizes : []),
            JSON.stringify(Array.isArray(item.details) ? item.details : []),
            Math.floor(Math.random() * 25) + 8, // realistic stock count between 8 and 32
            'active'
          ]);
        }
        console.log(`[MySQL] Successfully seeded ${PRODUCTS.length} products into MySQL products table.`);
      }
    } else {
      console.log('[MySQL] products table checked & ready.');
    }
  } catch (error) {
    console.error('[MySQL] initProductsTable error:', error.message);
  }
}



