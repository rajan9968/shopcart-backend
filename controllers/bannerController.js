import { pool } from '../config/db.js';

// GET /api/banners - Retrieve all banners (supports optional ?status=active)
export async function getBanners(req, res) {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM hero_banners';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY order_index ASC, id ASC';

    const [rows] = await pool.query(query, params);
    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('getBanners error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve hero banners',
      error: error.message
    });
  }
}

// GET /api/banners/:id - Retrieve single banner by ID
export async function getBannerById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM hero_banners WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Banner with ID ${id} not found`
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('getBannerById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve banner',
      error: error.message
    });
  }
}

// POST /api/banners - Create a new hero banner
export async function createBanner(req, res) {
  try {
    const {
      title,
      subtitle = '',
      image_url,
      mobile_image_url = null,
      cta_text = 'SHOP NOW',
      cta_link = '/collections',
      badge = null,
      order_index = 0,
      status = 'active'
    } = req.body;

    if (!title || !image_url) {
      return res.status(400).json({
        success: false,
        message: 'Title and Image URL are required'
      });
    }

    const insertSql = `
      INSERT INTO hero_banners (
        title, subtitle, image_url, mobile_image_url, cta_text, cta_link, badge, order_index, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertSql, [
      title.trim(),
      subtitle ? subtitle.trim() : '',
      image_url.trim(),
      mobile_image_url ? mobile_image_url.trim() : null,
      cta_text ? cta_text.trim() : 'SHOP NOW',
      cta_link ? cta_link.trim() : '/collections',
      badge ? badge.trim() : null,
      Number(order_index) || 0,
      status || 'active'
    ]);

    const [newBanner] = await pool.query('SELECT * FROM hero_banners WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Hero banner created successfully',
      data: newBanner[0]
    });
  } catch (error) {
    console.error('createBanner error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create hero banner',
      error: error.message
    });
  }
}

// PUT /api/banners/:id - Update an existing hero banner
export async function updateBanner(req, res) {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM hero_banners WHERE id = ?', [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Banner with ID ${id} not found`
      });
    }

    const current = existing[0];
    const title = req.body.title !== undefined ? req.body.title.trim() : current.title;
    const subtitle = req.body.subtitle !== undefined ? req.body.subtitle.trim() : current.subtitle;
    const image_url = req.body.image_url !== undefined ? req.body.image_url.trim() : current.image_url;
    const mobile_image_url = req.body.mobile_image_url !== undefined ? req.body.mobile_image_url : current.mobile_image_url;
    const cta_text = req.body.cta_text !== undefined ? req.body.cta_text.trim() : current.cta_text;
    const cta_link = req.body.cta_link !== undefined ? req.body.cta_link.trim() : current.cta_link;
    const badge = req.body.badge !== undefined ? req.body.badge : current.badge;
    const order_index = req.body.order_index !== undefined ? Number(req.body.order_index) : current.order_index;
    const status = req.body.status !== undefined ? req.body.status : current.status;

    const updateSql = `
      UPDATE hero_banners SET
        title = ?,
        subtitle = ?,
        image_url = ?,
        mobile_image_url = ?,
        cta_text = ?,
        cta_link = ?,
        badge = ?,
        order_index = ?,
        status = ?
      WHERE id = ?
    `;

    await pool.query(updateSql, [
      title,
      subtitle,
      image_url,
      mobile_image_url,
      cta_text,
      cta_link,
      badge,
      order_index,
      status,
      id
    ]);

    const [updated] = await pool.query('SELECT * FROM hero_banners WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Hero banner updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('updateBanner error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update hero banner',
      error: error.message
    });
  }
}

// DELETE /api/banners/:id - Delete a hero banner
export async function deleteBanner(req, res) {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM hero_banners WHERE id = ?', [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Banner with ID ${id} not found`
      });
    }

    await pool.query('DELETE FROM hero_banners WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Hero banner deleted successfully',
      id: Number(id)
    });
  } catch (error) {
    console.error('deleteBanner error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete hero banner',
      error: error.message
    });
  }
}

// POST /api/banners/upload - Upload a hero banner image
export async function uploadBannerImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      message: 'Banner image uploaded successfully',
      url: fileUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('uploadBannerImage error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload banner image',
      error: error.message
    });
  }
}

// PUT /api/banners/reorder - Batch reorder hero banners
export async function reorderBanners(req, res) {
  try {
    const { items } = req.body; // Array of { id, order_index }

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Expected items array for reordering'
      });
    }

    for (const item of items) {
      if (item.id && item.order_index !== undefined) {
        await pool.query('UPDATE hero_banners SET order_index = ? WHERE id = ?', [
          Number(item.order_index),
          item.id
        ]);
      }
    }

    const [rows] = await pool.query('SELECT * FROM hero_banners ORDER BY order_index ASC, id ASC');

    return res.status(200).json({
      success: true,
      message: 'Hero banners reordered successfully',
      data: rows
    });
  } catch (error) {
    console.error('reorderBanners error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reorder hero banners',
      error: error.message
    });
  }
}
