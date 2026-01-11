import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import worksRoutes from './routes/works.js';
import adminRoutes from './routes/admin.js';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = process.env.DATABASE_PATH || join(__dirname, '../data/archive.db');
const db = new Database(dbPath);

// Load environment variables
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'development-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API response helper
app.use((req, res, next) => {
  res.success = (data, meta = null) => {
    const response = { success: true, data };
    if (meta) response.meta = meta;
    return res.json(response);
  };

  res.error = (message, code = 'ERROR', status = 400) => {
    return res.status(status).json({
      success: false,
      error: { code, message }
    });
  };

  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/works', worksRoutes);
app.use('/api/admin', adminRoutes);

// Taxonomy routes - fetch from database
app.get('/api/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order, name').all();
    res.success(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.success([]);
  }
});

app.get('/api/tags', (req, res) => {
  try {
    const tags = db.prepare('SELECT * FROM tags ORDER BY name').all();
    res.success(tags);
  } catch (err) {
    console.error('Error fetching tags:', err);
    res.success([]);
  }
});

app.get('/api/work-types', (req, res) => {
  try {
    const workTypes = db.prepare('SELECT * FROM work_types ORDER BY sort_order, name').all();
    res.success(workTypes);
  } catch (err) {
    console.error('Error fetching work types:', err);
    res.success([]);
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
  ======================================
  Student Work Archive System - Backend
  ======================================
  Server running on: http://localhost:${PORT}
  Environment: ${process.env.NODE_ENV || 'development'}
  ======================================
  `);
});

export default app;
