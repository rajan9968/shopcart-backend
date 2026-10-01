import { pool } from '../config/db.js';

// Safe JSON parser helper
function parseJSON(str, fallback = []) {
  if (!str) return fallback;
  if (typeof str === 'object') return str;
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

// Format MySQL row into a rich, backwards-compatible product object
export function formatProduct(p) {
  const images = parseJSON(p.images, []);
  const sizes = parseJSON(p.sizes, ['XS (UK 8)', 'S (UK 10)', 'M (UK 12)', 'L (UK 14)', 'XL (UK 16)']);
  const details = parseJSON(p.details, [
    '100% Super-soft breathable fabric',
    'Hand-illustrated British boutique print',
    'Pocket piping and tonal mother-of-pearl buttons',
    'Machine wash gentle at 30°C'
  ]);
  const priceNum = parseFloat(p.price_gbp) || 0;
  const stockNum = parseInt(p.stock, 10) >= 0 ? parseInt(p.stock, 10) : 25;

  return {
    id: p.id,
    title: p.title,
    handle: p.handle || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    category: p.category || 'Womens',
    priceGBP: priceNum,
    price: `£${priceNum.toFixed(2)}`,
    compareAtPriceGBP: p.compare_at_price_gbp ? parseFloat(p.compare_at_price_gbp) : null,
    rating: p.rating ? String(p.rating) : '4.8',
    reviewCount: parseInt(p.review_count, 10) || 12,
    isBestseller: Boolean(p.is_bestseller === 1 || p.is_bestseller === true),
    isNew: Boolean(p.is_new === 1 || p.is_new === true),
    tag: p.tag || (p.is_bestseller ? 'BESTSELLER' : p.is_new ? 'NEW' : null),
    images: images,
    image: images.length > 0 ? images[0] : 'https://www.theirnibs.com/cdn/shop/files/Their_Nibs_X_Sophie_Ellis-Bextor_Oversize_Long_Pyjama_Set.jpg',
    description: p.description || '',
    sizes: sizes,
    details: details,
    stock: stockNum,
    stockCount: stockNum,
    stockStatus: stockNum === 0 ? 'Out of Stock' : stockNum <= 5 ? 'Low Stock' : 'In Stock',
    unitsSold: Math.floor(stockNum * 3.4) + 18,
    status: p.status || 'active',
    created: p.created,
    updated: p.updated
  };
}

// GET /api/products - Get all products with optional filters
export async function getProducts(req, res) {
  try {
    const { category, search, status, isBestseller, isNew, sort, limit, offset } = req.query;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    // Filter by status (default to active unless 'all' or specific status requested)
    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    } else if (!status) {
      // Return active products by default for storefront
      query += ' AND status = "active"';
    }

    // Filter by category
    if (category && category !== 'All') {
      query += ' AND (LOWER(category) = LOWER(?) OR LOWER(title) LIKE LOWER(?))';
      params.push(category, `%${category}%`);
    }

    // Search query in title or description
    if (search && search.trim() !== '') {
      query += ' AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(category) LIKE ?)';
      const s = `%${search.trim().toLowerCase()}%`;
      params.push(s, s, s);
    }

    // Bestseller filter
    if (isBestseller === 'true' || isBestseller === '1') {
      query += ' AND is_bestseller = 1';
    }

    // New arrivals filter
    if (isNew === 'true' || isNew === '1') {
      query += ' AND is_new = 1';
    }

    // Sorting
    if (sort === 'price-low') {
      query += ' ORDER BY price_gbp ASC';
    } else if (sort === 'price-high') {
      query += ' ORDER BY price_gbp DESC';
    } else if (sort === 'rating') {
      query += ' ORDER BY rating DESC';
    } else if (sort === 'newest') {
      query += ' ORDER BY is_new DESC, id DESC';
    } else {
      query += ' ORDER BY id DESC';
    }

    // Optional pagination limit
    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit, 10));
      if (offset) {
        query += ' OFFSET ?';
        params.push(parseInt(offset, 10));
      }
    }

    const [rows] = await pool.query(query, params);
    const formatted = rows.map(formatProduct);

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    console.error('getProducts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve products',
      error: error.message
    });
  }
}

// GET /api/products/:id - Get single product by ID or handle
export async function getProductById(req, res) {
  try {
    const { id } = req.params;
    let query = 'SELECT * FROM products WHERE id = ?';
    let params = [id];

    // If ID is not purely numeric, match by handle or title slug
    if (isNaN(id)) {
      query = 'SELECT * FROM products WHERE handle = ? OR LOWER(title) = LOWER(?)';
      params = [id, id.replace(/-/g, ' ')];
    }

    const [rows] = await pool.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Product with identifier '${id}' not found`
      });
    }

    return res.status(200).json({
      success: true,
      data: formatProduct(rows[0])
    });
  } catch (error) {
    console.error('getProductById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve product',
      error: error.message
    });
  }
}

// POST /api/products - Create a new product
export async function createProduct(req, res) {
  try {
    const {
      title,
      handle,
      category = 'Womens',
      price_gbp,
      priceGBP,
      compare_at_price_gbp,
      compareAtPriceGBP,
      rating = 5.0,
      review_count = 0,
      reviewCount = 0,
      is_bestseller = false,
      isBestseller = false,
      is_new = true,
      isNew = true,
      tag,
      images = [],
      image,
      description = '',
      sizes = ['XS (UK 8)', 'S (UK 10)', 'M (UK 12)', 'L (UK 14)', 'XL (UK 16)'],
      details = [
        '100% Super-soft breathable fabric',
        'Hand-illustrated British boutique print',
        'Pocket piping and tonal mother-of-pearl buttons',
        'Machine wash gentle at 30°C'
      ],
      stock = 25,
      status = 'active'
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Product title is required'
      });
    }

    const resolvedPrice = parseFloat(price_gbp !== undefined ? price_gbp : priceGBP) || 45.00;
    const resolvedComparePrice = (compare_at_price_gbp || compareAtPriceGBP) ? parseFloat(compare_at_price_gbp || compareAtPriceGBP) : null;
    const resolvedHandle = handle || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const resolvedBestseller = is_bestseller || isBestseller ? 1 : 0;
    const resolvedNew = is_new || isNew ? 1 : 0;
    const resolvedReviewCount = parseInt(review_count || reviewCount, 10) || 0;
    const resolvedRating = parseFloat(rating) || 5.0;
    const resolvedStock = parseInt(stock, 10) >= 0 ? parseInt(stock, 10) : 25;

    // Normalise images array
    let imagesArr = [];
    if (Array.isArray(images) && images.length > 0) {
      imagesArr = images;
    } else if (typeof images === 'string' && images.trim() !== '') {
      imagesArr = [images.trim()];
    } else if (image && image.trim() !== '') {
      imagesArr = [image.trim()];
    }

    // Normalise sizes
    const sizesArr = Array.isArray(sizes) ? sizes : typeof sizes === 'string' ? sizes.split(',').map(s => s.trim()) : [];
    // Normalise details
    const detailsArr = Array.isArray(details) ? details : typeof details === 'string' ? details.split('\n').map(d => d.trim()) : [];

    const insertSql = `
      INSERT INTO products (
        title, handle, category, price_gbp, compare_at_price_gbp,
        rating, review_count, is_bestseller, is_new, tag,
        images, description, sizes, details, stock, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertSql, [
      title.trim(),
      resolvedHandle,
      category,
      resolvedPrice,
      resolvedComparePrice,
      resolvedRating,
      resolvedReviewCount,
      resolvedBestseller,
      resolvedNew,
      tag || (resolvedBestseller ? 'BESTSELLER' : resolvedNew ? 'NEW' : null),
      JSON.stringify(imagesArr),
      description.trim(),
      JSON.stringify(sizesArr),
      JSON.stringify(detailsArr),
      resolvedStock,
      status
    ]);

    const [newProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: formatProduct(newProduct[0])
    });
  } catch (error) {
    console.error('createProduct error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
}

// PUT /api/products/:id - Update product
export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} not found`
      });
    }

    const current = existing[0];
    const b = req.body;

    const title = b.title !== undefined ? b.title.trim() : current.title;
    const handle = b.handle !== undefined ? b.handle.trim() : current.handle;
    const category = b.category !== undefined ? b.category : current.category;
    const price_gbp = (b.price_gbp !== undefined || b.priceGBP !== undefined)
      ? parseFloat(b.price_gbp !== undefined ? b.price_gbp : b.priceGBP)
      : current.price_gbp;
    const compare_at_price_gbp = (b.compare_at_price_gbp !== undefined || b.compareAtPriceGBP !== undefined)
      ? parseFloat(b.compare_at_price_gbp !== undefined ? b.compare_at_price_gbp : b.compareAtPriceGBP)
      : current.compare_at_price_gbp;
    const rating = b.rating !== undefined ? parseFloat(b.rating) : current.rating;
    const review_count = (b.review_count !== undefined || b.reviewCount !== undefined)
      ? parseInt(b.review_count !== undefined ? b.review_count : b.reviewCount, 10)
      : current.review_count;
    const is_bestseller = (b.is_bestseller !== undefined || b.isBestseller !== undefined)
      ? (b.is_bestseller || b.isBestseller ? 1 : 0)
      : current.is_bestseller;
    const is_new = (b.is_new !== undefined || b.isNew !== undefined)
      ? (b.is_new || b.isNew ? 1 : 0)
      : current.is_new;
    const tag = b.tag !== undefined ? b.tag : current.tag;
    const description = b.description !== undefined ? b.description : current.description;
    const stock = (b.stock !== undefined || b.stockCount !== undefined)
      ? parseInt(b.stock !== undefined ? b.stock : b.stockCount, 10)
      : current.stock;
    const status = b.status !== undefined ? b.status : current.status;

    // Handle images array
    let imagesStr = current.images;
    if (b.images !== undefined) {
      imagesStr = JSON.stringify(Array.isArray(b.images) ? b.images : [b.images]);
    } else if (b.image !== undefined) {
      imagesStr = JSON.stringify([b.image]);
    }

    // Handle sizes
    let sizesStr = current.sizes;
    if (b.sizes !== undefined) {
      sizesStr = JSON.stringify(Array.isArray(b.sizes) ? b.sizes : b.sizes.split(',').map(s => s.trim()));
    }

    // Handle details
    let detailsStr = current.details;
    if (b.details !== undefined) {
      detailsStr = JSON.stringify(Array.isArray(b.details) ? b.details : b.details.split('\n').map(d => d.trim()));
    }

    const updateSql = `
      UPDATE products SET
        title = ?,
        handle = ?,
        category = ?,
        price_gbp = ?,
        compare_at_price_gbp = ?,
        rating = ?,
        review_count = ?,
        is_bestseller = ?,
        is_new = ?,
        tag = ?,
        images = ?,
        description = ?,
        sizes = ?,
        details = ?,
        stock = ?,
        status = ?
      WHERE id = ?
    `;

    await pool.query(updateSql, [
      title,
      handle,
      category,
      price_gbp,
      compare_at_price_gbp,
      rating,
      review_count,
      is_bestseller,
      is_new,
      tag,
      imagesStr,
      description,
      sizesStr,
      detailsStr,
      stock,
      status,
      id
    ]);

    const [updated] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: formatProduct(updated[0])
    });
  } catch (error) {
    console.error('updateProduct error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
}

// DELETE /api/products/:id - Delete product
export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} not found`
      });
    }

    await pool.query('DELETE FROM products WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      id: Number(id)
    });
  } catch (error) {
    console.error('deleteProduct error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
}

// POST /api/products/upload - Upload product image
export async function uploadProductImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      message: 'Product image uploaded successfully',
      url: fileUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('uploadProductImage error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload product image',
      error: error.message
    });
  }
}

// POST /api/products/reset - Restore initial boutique catalog
export async function resetProducts(req, res) {
  try {
    const { PRODUCTS } = await import('../data/initialProducts.js');

    await pool.query('TRUNCATE TABLE products');

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
        Math.floor(Math.random() * 25) + 8,
        'active'
      ]);
    }

    const [rows] = await pool.query('SELECT * FROM products ORDER BY id DESC');
    return res.status(200).json({
      success: true,
      message: `Reset catalog successfully to ${rows.length} default products`,
      count: rows.length,
      data: rows.map(formatProduct)
    });
  } catch (error) {
    console.error('resetProducts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset product catalog',
      error: error.message
    });
  }
}
