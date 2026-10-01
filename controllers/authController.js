import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'their_nibs_ecom_secret_jwt_key_2026';

// 1. User Login Controller
export async function login(req, res) {
  try {
    const { username, email, password } = req.body;
    const loginIdentifier = (username || email || '').trim();

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.'
      });
    }

    // Query MySQL users table
    const [rows] = await pool.query(
      'SELECT id, username, password, stauts, role, created FROM users WHERE username = ? LIMIT 1',
      [loginIdentifier]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    const user = rows[0];

    // Check account status (note column name 'stauts' in table schema)
    if (user.stauts && user.stauts.toLowerCase() !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact store administrator.'
      });
    }

    // Check password (supports both plain text and bcrypt hash)
    let isPasswordValid = false;
    if (user.password === password) {
      isPasswordValid = true;
    } else {
      isPasswordValid = await bcrypt.compare(password, user.password).catch(() => false);
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role || 'admin'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role || 'admin',
        stauts: user.stauts || 'active',
        created: user.created
      }
    });
  } catch (error) {
    console.error('[Login Controller Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Database server error. Please ensure MySQL is running.',
      error: error.message
    });
  }
}

// 2. User Register / Add User Controller
export async function register(req, res) {
  try {
    const { username, password, role = 'admin', stauts = 'active' } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.'
      });
    }

    // Check if user already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ? LIMIT 1',
      [username.trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username is already taken.'
      });
    }

    // Hash password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (username, password, stauts, role, created) VALUES (?, ?, ?, ?, NOW())',
      [username.trim(), hashedPassword, stauts, role]
    );

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      userId: result.insertId
    });
  } catch (error) {
    console.error('[Register Controller Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create user.',
      error: error.message
    });
  }
}

// 3. Get Current Logged-in User
export async function getMe(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, stauts, role, created FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    return res.status(200).json({
      success: true,
      user: rows[0]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching user profile.',
      error: error.message
    });
  }
}

// 4. List All Users (Admin)
export async function getAllUsers(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, stauts, role, created FROM users ORDER BY id DESC'
    );

    return res.status(200).json({
      success: true,
      count: rows.length,
      users: rows
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving user list.',
      error: error.message
    });
  }
}
