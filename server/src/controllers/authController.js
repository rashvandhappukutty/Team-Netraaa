import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { JWT_SECRET } from '../middleware/auth.js';
import { recordAuditLog } from '../services/auditService.js';

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User record not found.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Record Login audit
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    recordAuditLog({
      userId: user.id,
      action: 'LOGIN',
      details: `User ${user.name} (${user.role}) authenticated successfully.`,
      ipAddress: ip
    });

    const { password_hash, ...userProfile } = user;
    return res.json({
      message: 'Authentication successful',
      token,
      user: userProfile
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
}

export function logout(req, res) {
  try {
    if (req.user) {
      const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      recordAuditLog({
        userId: req.user.id,
        action: 'LOGOUT',
        details: `User ${req.user.name} terminated session.`,
        ipAddress: ip
      });
    }
    return res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Error processing logout.' });
  }
}

export function getMe(req, res) {
  return res.json({ user: req.user });
}
