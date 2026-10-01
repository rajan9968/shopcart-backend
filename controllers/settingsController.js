import { pool } from '../config/db.js';

// GET /api/settings - Retrieve global website settings
export async function getSettings(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM site_settings ORDER BY id ASC LIMIT 1');
    
    if (rows.length > 0) {
      return res.status(200).json({
        success: true,
        data: rows[0]
      });
    }

    // Fallback default if row doesn't exist yet
    const defaultSettings = {
      site_name: 'Their Nibs London',
      site_tagline: 'Luxury Pyjamas, Nightwear & Loungewear',
      logo_url: 'https://www.theirnibs.com/cdn/shop/files/TheirNibs_Logo_Navy_Wide.png',
      favicon_url: 'https://www.theirnibs.com/cdn/shop/files/TheirNibs_Logo_Navy_Wide.png',
      email: 'support@theirnibs.com',
      phone: '+44 (0) 20 8123 4567',
      whatsapp: '+44 7123 456789',
      address: 'Studio 14, The Light Box, 111 Power Road, London, W4 5PY, United Kingdom',
      city: 'London',
      postal_code: 'W4 5PY',
      country: 'United Kingdom',
      facebook: 'https://facebook.com/theirnibs',
      instagram: 'https://instagram.com/theirnibs',
      twitter: 'https://twitter.com/theirnibs',
      pinterest: 'https://pinterest.com/theirnibs',
      tiktok: 'https://tiktok.com/@theirnibs',
      youtube: 'https://youtube.com/@theirnibs',
      copyright_text: '© 2026 Their Nibs London. All Rights Reserved.'
    };

    const insertSql = `
      INSERT INTO site_settings (
        id, site_name, site_tagline, logo_url, favicon_url, email, phone, whatsapp,
        address, city, postal_code, country, facebook, instagram, twitter, pinterest,
        tiktok, youtube, copyright_text
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.query(insertSql, [
      defaultSettings.site_name,
      defaultSettings.site_tagline,
      defaultSettings.logo_url,
      defaultSettings.favicon_url,
      defaultSettings.email,
      defaultSettings.phone,
      defaultSettings.whatsapp,
      defaultSettings.address,
      defaultSettings.city,
      defaultSettings.postal_code,
      defaultSettings.country,
      defaultSettings.facebook,
      defaultSettings.instagram,
      defaultSettings.twitter,
      defaultSettings.pinterest,
      defaultSettings.tiktok,
      defaultSettings.youtube,
      defaultSettings.copyright_text
    ]);

    return res.status(200).json({
      success: true,
      data: defaultSettings
    });
  } catch (error) {
    console.error('getSettings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve site settings',
      error: error.message
    });
  }
}

// PUT /api/settings - Update website settings
export async function updateSettings(req, res) {
  try {
    // Check existing settings row
    const [existing] = await pool.query('SELECT * FROM site_settings ORDER BY id ASC LIMIT 1');
    const current = existing.length > 0 ? existing[0] : {};

    const site_name = req.body.site_name !== undefined ? req.body.site_name : (current.site_name || 'Their Nibs London');
    const site_tagline = req.body.site_tagline !== undefined ? req.body.site_tagline : (current.site_tagline || 'Luxury Pyjamas, Nightwear & Loungewear');
    const logo_url = req.body.logo_url !== undefined ? req.body.logo_url : (current.logo_url || 'https://www.theirnibs.com/cdn/shop/files/TheirNibs_Logo_Navy_Wide.png');
    const favicon_url = req.body.favicon_url !== undefined ? req.body.favicon_url : (current.favicon_url || 'https://www.theirnibs.com/cdn/shop/files/TheirNibs_Logo_Navy_Wide.png');
    const email = req.body.email !== undefined ? req.body.email : (current.email || 'support@theirnibs.com');
    const phone = req.body.phone !== undefined ? req.body.phone : (current.phone || '+44 (0) 20 8123 4567');
    const whatsapp = req.body.whatsapp !== undefined ? req.body.whatsapp : (current.whatsapp || '+44 7123 456789');
    const address = req.body.address !== undefined ? req.body.address : (current.address || 'Studio 14, The Light Box, 111 Power Road, London, W4 5PY, United Kingdom');
    const city = req.body.city !== undefined ? req.body.city : (current.city || 'London');
    const postal_code = req.body.postal_code !== undefined ? req.body.postal_code : (current.postal_code || 'W4 5PY');
    const country = req.body.country !== undefined ? req.body.country : (current.country || 'United Kingdom');
    const facebook = req.body.facebook !== undefined ? req.body.facebook : (current.facebook || 'https://facebook.com/theirnibs');
    const instagram = req.body.instagram !== undefined ? req.body.instagram : (current.instagram || 'https://instagram.com/theirnibs');
    const twitter = req.body.twitter !== undefined ? req.body.twitter : (current.twitter || 'https://twitter.com/theirnibs');
    const pinterest = req.body.pinterest !== undefined ? req.body.pinterest : (current.pinterest || 'https://pinterest.com/theirnibs');
    const tiktok = req.body.tiktok !== undefined ? req.body.tiktok : (current.tiktok || 'https://tiktok.com/@theirnibs');
    const youtube = req.body.youtube !== undefined ? req.body.youtube : (current.youtube || 'https://youtube.com/@theirnibs');
    const copyright_text = req.body.copyright_text !== undefined ? req.body.copyright_text : (current.copyright_text || '© 2026 Their Nibs London. All Rights Reserved.');

    if (existing.length === 0) {
      const insertSql = `
        INSERT INTO site_settings (
          id, site_name, site_tagline, logo_url, favicon_url, email, phone, whatsapp,
          address, city, postal_code, country, facebook, instagram, twitter, pinterest,
          tiktok, youtube, copyright_text
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await pool.query(insertSql, [
        site_name, site_tagline, logo_url, favicon_url, email, phone, whatsapp,
        address, city, postal_code, country, facebook, instagram, twitter, pinterest,
        tiktok, youtube, copyright_text
      ]);
    } else {
      const updateSql = `
        UPDATE site_settings SET
          site_name = ?,
          site_tagline = ?,
          logo_url = ?,
          favicon_url = ?,
          email = ?,
          phone = ?,
          whatsapp = ?,
          address = ?,
          city = ?,
          postal_code = ?,
          country = ?,
          facebook = ?,
          instagram = ?,
          twitter = ?,
          pinterest = ?,
          tiktok = ?,
          youtube = ?,
          copyright_text = ?
        WHERE id = ?
      `;
      await pool.query(updateSql, [
        site_name, site_tagline, logo_url, favicon_url, email, phone, whatsapp,
        address, city, postal_code, country, facebook, instagram, twitter, pinterest,
        tiktok, youtube, copyright_text,
        existing[0].id
      ]);
    }

    // Fetch the updated record
    const [updatedRows] = await pool.query('SELECT * FROM site_settings ORDER BY id ASC LIMIT 1');

    return res.status(200).json({
      success: true,
      message: 'Website settings updated successfully',
      data: updatedRows[0]
    });
  } catch (error) {
    console.error('updateSettings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update site settings',
      error: error.message
    });
  }
}

// POST /api/settings/upload - Handle logo or favicon file upload
export async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file was uploaded.'
      });
    }

    const host = req.get('host') || 'localhost:5001';
    const protocol = req.protocol || 'http';
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    const type = req.body.type || 'upload'; // 'logo' or 'favicon'

    // Automatically update database record if requested
    if (type === 'logo') {
      await pool.query('UPDATE site_settings SET logo_url = ? WHERE id = 1', [fileUrl]);
    } else if (type === 'favicon') {
      await pool.query('UPDATE site_settings SET favicon_url = ? WHERE id = 1', [fileUrl]);
    }

    return res.status(200).json({
      success: true,
      message: `${type === 'logo' ? 'Logo' : type === 'favicon' ? 'Favicon' : 'Image'} uploaded successfully!`,
      url: fileUrl,
      type,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('uploadImage error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload image file',
      error: error.message
    });
  }
}


