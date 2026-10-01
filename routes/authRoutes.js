import { Router } from 'express';
import { login, register, getMe, getAllUsers } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.get('/me', verifyToken, getMe);
router.get('/users', verifyToken, getAllUsers);

export default router;
