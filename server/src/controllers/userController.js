import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { recordAuditLog } from '../services/auditService.js';

export function getInvestigators(req, res) {
  try {
    const investigators = db.all(`
      SELECT id, name, email, role, badge_number, department
      FROM users
      WHERE role = 'INVESTIGATOR'
      ORDER BY name ASC
    `);
    return res.json({ investigators });
  } catch (error) {
    console.error('Error fetching investigators:', error);
    return res.status(500).json({ error: 'Failed to fetch investigators.' });
  }
}

export function getAllUsers(req, res) {
  try {
    const users = db.all(`
      SELECT id, name, email, role, badge_number, department, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    return res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch user directory.' });
  }
}

export function createUser(req, res) {
  try {
    const { name, email, password, role = 'INVESTIGATOR', badge_number = '', department = '' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existing = db.get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const insertRes = db.run(`
      INSERT INTO users (name, email, password_hash, role, badge_number, department)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name.trim(), email.trim().toLowerCase(), password_hash, role.toUpperCase(), badge_number.trim(), department.trim()]);

    const newUserId = insertRes.lastInsertRowid;
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    recordAuditLog({
      userId: req.user.id,
      action: 'USER_CREATED',
      details: `Created user account ${name} (${role.toUpperCase()}, Badge: ${badge_number}) by Admin ${req.user.name}.`,
      ipAddress: ip
    });

    const createdUser = db.get('SELECT id, name, email, role, badge_number, department, created_at FROM users WHERE id = ?', [newUserId]);
    return res.status(201).json({
      message: 'User created successfully',
      user: createdUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Failed to create user account.' });
  }
}
