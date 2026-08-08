const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// ── Security Middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

// FIX #4: Rate Limiting — was installed but NEVER applied before.
// Auth limiter: max 10 login/register attempts per 15 minutes per IP.
// Prevents brute-force password attacks.
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,  // 15 minutes
  max:             10,               // max 10 requests per window
  message:         { success: false, error: 'Too many attempts. Please try again in 15 minutes.' },
  standardHeaders: true,            // Return rate limit info in RateLimit-* headers
  legacyHeaders:   false,
});

// General API limiter: max 100 requests per minute per IP.
// Prevents scraping and general abuse.
const apiLimiter = rateLimit({
  windowMs:        60 * 1000,        // 1 minute
  max:             100,              // max 100 requests per window
  message:         { success: false, error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// ── Routes ────────────────────────────────────────────────────────────────
// Public API routes — general limiter (100 req/min)
app.use('/api/companies', apiLimiter,  require('./routes/companies'));
app.use('/api/company',   apiLimiter,  require('./routes/company'));
app.use('/api/search',    apiLimiter,  require('./routes/search'));
app.use('/api/topics',    apiLimiter,  require('./routes/topics'));
app.use('/api/stats',     apiLimiter,  require('./routes/stats'));

// Auth routes — strict limiter (10 req/15min) to prevent brute-force
app.use('/api/auth',      authLimiter, require('./routes/auth'));

// GET /api/me — shorthand for current user profile
// Mounted separately so the URL is clean: GET /api/me (not /api/auth/me)
app.get('/api/me', authLimiter, require('./middleware/authenticate'), async (req, res, next) => {
  try {
    const prisma = require('./lib/prisma');
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { id: true, name: true, email: true, avatar: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user });
  } catch (e) { next(e); }
});

// User feature routes — general limiter
app.use('/api/progress',  apiLimiter,  require('./routes/progress'));
app.use('/api/bookmarks', apiLimiter,  require('./routes/bookmarks'));
app.use('/api/dashboard', apiLimiter,  require('./routes/dashboard'));

app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Global error handler
app.use(require('./middleware/errorHandler'));

module.exports = app;
