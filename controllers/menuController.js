import { pool } from '../config/db.js';

// Get nested menu tree (for website frontend & header navigation)
export async function getMenuTree(req, res) {
  try {
    const includeInactive = req.query.all === 'true';
    const query = includeInactive 
      ? 'SELECT * FROM website_menus ORDER BY order_index ASC, id ASC'
      : "SELECT * FROM website_menus WHERE status = 'active' ORDER BY order_index ASC, id ASC";

    const [rows] = await pool.query(query);

    // Build parent-child tree
    const menuMap = new Map();
    const topLevelMenus = [];

    // First pass: register all items
    rows.forEach((item) => {
      menuMap.set(item.id, { ...item, submenus: [] });
    });

    // Second pass: attach submenus to their parent
    rows.forEach((item) => {
      const mappedItem = menuMap.get(item.id);
      if (item.parent_id && menuMap.has(item.parent_id)) {
        menuMap.get(item.parent_id).submenus.push(mappedItem);
      } else {
        topLevelMenus.push(mappedItem);
      }
    });

    return res.status(200).json({
      success: true,
      count: topLevelMenus.length,
      data: topLevelMenus
    });
  } catch (error) {
    console.error('getMenuTree error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve website menu tree',
      error: error.message
    });
  }
}

// Get all menus flat list (with parent info, for admin table)
export async function getAllMenus(req, res) {
  try {
    const query = `
      SELECT 
        m.*,
        p.title AS parent_title
      FROM website_menus m
      LEFT JOIN website_menus p ON m.parent_id = p.id
      ORDER BY 
        COALESCE(m.parent_id, m.id) ASC, 
        m.parent_id IS NOT NULL ASC, 
        m.order_index ASC, 
        m.id ASC
    `;
    const [rows] = await pool.query(query);

    // Also get parent options for dropdowns (items with parent_id IS NULL)
    const [parentOptions] = await pool.query(
      'SELECT id, title FROM website_menus WHERE parent_id IS NULL ORDER BY order_index ASC, title ASC'
    );

    return res.status(200).json({
      success: true,
      total: rows.length,
      parents: parentOptions,
      data: rows
    });
  } catch (error) {
    console.error('getAllMenus error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve menu list',
      error: error.message
    });
  }
}

// Create new menu or submenu item
export async function createMenuItem(req, res) {
  try {
    const { title, url, parent_id, order_index, status, badge, target } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Menu title is required'
      });
    }

    const finalUrl = (url && url.trim()) || '/';
    const finalParentId = parent_id ? Number(parent_id) : null;
    const finalOrderIndex = Number(order_index) || 0;
    const finalStatus = status === 'inactive' ? 'inactive' : 'active';
    const finalBadge = badge && badge.trim() ? badge.trim().toUpperCase() : null;
    const finalTarget = target || '_self';

    const insertSql = `
      INSERT INTO website_menus 
        (title, url, parent_id, order_index, status, badge, target)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(insertSql, [
      title.trim(),
      finalUrl,
      finalParentId,
      finalOrderIndex,
      finalStatus,
      finalBadge,
      finalTarget
    ]);

    const [newItem] = await pool.query('SELECT * FROM website_menus WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: finalParentId ? 'Submenu item created successfully' : 'Main menu item created successfully',
      data: newItem[0]
    });
  } catch (error) {
    console.error('createMenuItem error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create menu item',
      error: error.message
    });
  }
}

// Update menu or submenu item
export async function updateMenuItem(req, res) {
  try {
    const { id } = req.params;
    const { title, url, parent_id, order_index, status, badge, target } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Menu title is required'
      });
    }

    const finalUrl = (url && url.trim()) || '/';
    const finalParentId = parent_id ? Number(parent_id) : null;
    const finalOrderIndex = Number(order_index) || 0;
    const finalStatus = status === 'inactive' ? 'inactive' : 'active';
    const finalBadge = badge && badge.trim() ? badge.trim().toUpperCase() : null;
    const finalTarget = target || '_self';

    // Prevent making an item its own parent
    if (finalParentId && finalParentId === Number(id)) {
      return res.status(400).json({
        success: false,
        message: 'A menu item cannot be its own parent'
      });
    }

    const updateSql = `
      UPDATE website_menus
      SET 
        title = ?,
        url = ?,
        parent_id = ?,
        order_index = ?,
        status = ?,
        badge = ?,
        target = ?
      WHERE id = ?
    `;

    const [result] = await pool.query(updateSql, [
      title.trim(),
      finalUrl,
      finalParentId,
      finalOrderIndex,
      finalStatus,
      finalBadge,
      finalTarget,
      Number(id)
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    const [updatedItem] = await pool.query('SELECT * FROM website_menus WHERE id = ?', [Number(id)]);

    return res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: updatedItem[0]
    });
  } catch (error) {
    console.error('updateMenuItem error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update menu item',
      error: error.message
    });
  }
}

// Toggle menu item status (active / inactive)
export async function toggleMenuStatus(req, res) {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT status FROM website_menus WHERE id = ?', [Number(id)]);
    
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    const nextStatus = existing[0].status === 'active' ? 'inactive' : 'active';
    await pool.query('UPDATE website_menus SET status = ? WHERE id = ?', [nextStatus, Number(id)]);

    return res.status(200).json({
      success: true,
      message: `Menu status changed to ${nextStatus}`,
      status: nextStatus
    });
  } catch (error) {
    console.error('toggleMenuStatus error:', error);
    return res.status(500).json({ success: false, message: 'Failed to toggle menu status' });
  }
}

// Delete menu item (and any children submenus)
export async function deleteMenuItem(req, res) {
  try {
    const { id } = req.params;
    const menuId = Number(id);

    // Delete submenus first if any
    const [subDelete] = await pool.query('DELETE FROM website_menus WHERE parent_id = ?', [menuId]);
    // Then delete item
    const [deleteResult] = await pool.query('DELETE FROM website_menus WHERE id = ?', [menuId]);

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Menu item and ${subDelete.affectedRows} child submenus deleted successfully`
    });
  } catch (error) {
    console.error('deleteMenuItem error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete menu item',
      error: error.message
    });
  }
}

// Remove all menus and submenus from database
export async function clearAllMenus(req, res) {
  try {
    await pool.query('DELETE FROM website_menus');
    return res.status(200).json({
      success: true,
      message: 'All default website menus and submenus removed successfully'
    });
  } catch (error) {
    console.error('clearAllMenus error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear menus',
      error: error.message
    });
  }
}

