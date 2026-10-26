import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from '../config/db.js';

export async function register(req, res, next) {
  try {
    const { name, email, password, role = 'passenger', phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    const pool = getPool();

    // Check if email already registered
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const validRoles = ['admin', 'passenger', 'driver'];
    const assignedRole = validRoles.includes(role) ? role : 'passenger';

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, assignedRole, phone || null]
    );

    const token = jwt.sign(
      { id: result.insertId, name, email, role: assignedRole },
      process.env.JWT_SECRET || 'transfleet_super_secret_jwt_key_2026_fsd',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: {
        id: result.insertId,
        name,
        email,
        role: assignedRole,
        phone
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const pool = getPool();
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'transfleet_super_secret_jwt_key_2026_fsd',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const pool = getPool();
    const [users] = await pool.query(
      'SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    next(error);
  }
}

export async function getDrivers(req, res, next) {
  try {
    const pool = getPool();
    const [drivers] = await pool.query(
      'SELECT id, name, email, phone FROM users WHERE role = "driver" ORDER BY name ASC'
    );
    res.json({ success: true, data: drivers });
  } catch (error) {
    next(error);
  }
}
