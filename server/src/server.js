import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDb } from './config/db.js';
import { initializeDatabase } from './database/schema.js';
import { seedDatabase } from './database/seed.js';

import authRoutes from './routes/authRoutes.js';
import investigationRoutes from './routes/investigationRoutes.js';
import dataSourceRoutes from './routes/dataSourceRoutes.js';
import entityRoutes from './routes/entityRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import userRoutes from './routes/userRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'NETRA AI-Powered Criminal Network & Intelligence Analysis System',
    tagline: 'From Fragmented Data to Actionable Intelligence.',
    version: '3.0.0-master-prototype',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/investigations', investigationRoutes);
app.use('/api/data-sources', dataSourceRoutes);
app.use('/api/entities', entityRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api', analysisRoutes);

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled API Error:', err);
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }
  return res.status(500).json({ error: err.message || 'Internal server error occurred.' });
});

// Initialize DB and launch server
async function startServer() {
  try {
    console.log('🔄 Initializing SQLite database engine...');
    await initDb();
    initializeDatabase();
    await seedDatabase();
    
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🛡️  NETRA Phase 2 Intelligence Server on http://localhost:${PORT}`);
      console.log(`🔒 "From Fragmented Data to Actionable Intelligence."`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('❌ Failed to start NETRA server:', error);
    process.exit(1);
  }
}

startServer();
