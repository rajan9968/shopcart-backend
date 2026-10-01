import express from 'express';
import {
  getMenuTree,
  getAllMenus,
  createMenuItem,
  updateMenuItem,
  toggleMenuStatus,
  deleteMenuItem,
  clearAllMenus
} from '../controllers/menuController.js';

const router = express.Router();

// Public website menu tree
router.get('/', getMenuTree);

// Admin flat/grouped list of menus and submenus
router.get('/all', getAllMenus);

// Create new menu or submenu item
router.post('/', createMenuItem);

// Clear all menus and submenus
router.delete('/clear', clearAllMenus);

// Update menu or submenu item
router.put('/:id', updateMenuItem);

// Quick toggle active / inactive status
router.patch('/:id/toggle', toggleMenuStatus);

// Delete menu item (and any children submenus)
router.delete('/:id', deleteMenuItem);

export default router;
