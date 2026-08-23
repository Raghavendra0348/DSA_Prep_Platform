const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// ── Security Middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// ── HTTP Request Logging (M1: morgan) ─────────────────────────────────────
// "dev" format: GET /api/stats 200 12ms — only in non-production
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined')); // fuller logs in production
}

// ── Rate Limiters ──────────────────────────────────────────────────────────
// Auth limiter: max 10 login/register attempts per 15 minutes per IP.
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,  // 15 minutes
  max:             10,
  message:         { success: false, error: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// General API limiter: max 100 requests per minute per IP.
const apiLimiter = rateLimit({
  windowMs:        60 * 1000,        // 1 minute
  max:             100,
  message:         { success: false, error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// ── Public Routes ─────────────────────────────────────────────────────────
app.use('/api/companies',  apiLimiter,  require('./routes/companies'));
app.use('/api/company',    apiLimiter,  require('./routes/company'));
app.use('/api/questions',  apiLimiter,  require('./routes/questions'));  // NEW: GET /api/questions/:slug
app.use('/api/search',     apiLimiter,  require('./routes/search'));
app.use('/api/topics',     apiLimiter,  require('./routes/topics'));
app.use('/api/stats',      apiLimiter,  require('./routes/stats'));
app.use('/api/contact',    apiLimiter,  require('./routes/contact'));

// ── Auth Routes (strict rate limit) ──────────────────────────────────────
// Covers: POST /register | POST /login | POST /refresh | POST /logout | GET /me (via auth.js)
app.use('/api/auth',       authLimiter, require('./routes/auth'));

// ── User Profile Routes ───────────────────────────────────────────────────
// GET  /api/me          → get profile
// PUT  /api/me          → update name / avatar    (NEW)
// PUT  /api/me/password → change password         (NEW)
app.use('/api/me',         apiLimiter,  require('./routes/user'));

// ── User Feature Routes ───────────────────────────────────────────────────
app.use('/api/progress',   apiLimiter,  require('./routes/progress'));
app.use('/api/bookmarks',  apiLimiter,  require('./routes/bookmarks'));
app.use('/api/dashboard',  apiLimiter,  require('./routes/dashboard'));

// ── Health Check ──────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// ── Global Error Handler ──────────────────────────────────────────────────
// Catches Prisma errors, Zod validation errors, JWT errors, and generic 500s
app.use(require('./middleware/errorHandler'));

module.exports = app;
