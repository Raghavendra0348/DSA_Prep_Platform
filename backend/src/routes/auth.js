const router       = require('express').Router();
const bcrypt       = require('bcryptjs');
const jwt          = require('jsonwebtoken');
const { z }        = require('zod');
const prisma       = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');

// ── Zod schemas (FIX: replaces manual if-checks) ───────────────────────────
const registerSchema = z.object({
  email:    z.string().email({ message: 'Invalid email format' }),
  name:     z.string().trim().min(1, { message: 'Name cannot be empty' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const loginSchema = z.object({
  email:    z.string().email({ message: 'Invalid email format' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

// ── Token helpers ───────────────────────────────────────────────────────────
function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function signRefreshToken(payload) {
  // Refresh tokens live longer — 30 days — stored in DB for invalidation
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh', { expiresIn: '30d' });
}

// ── POST /api/auth/register ────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    // Zod parse throws ZodError (caught by errorHandler) on invalid input
    const { email, name, password } = registerSchema.parse(req.body);

    // Check if email already registered
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return res.status(409).json({ success: false, error: 'Email already registered', code: 'EMAIL_EXISTS' });

    // Hash password (bcrypt adds salt automatically)
    const hashed = await bcrypt.hash(password, 10);

    // Create user — store email in lowercase for consistency
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), name: name.trim(), password: hashed },
    });

    const accessToken  = signAccessToken({ id: user.id, email: user.email });
    const refreshToken = signRefreshToken({ id: user.id, email: user.email });

    // Store refresh token in DB
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id },
    });

    res.status(201).json({
      success: true,
      token:        accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (e) { next(e); }
});

// ── POST /api/auth/login ───────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user — use lowercase email to match registration
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // Always use bcrypt.compare (even if user not found) to prevent timing attacks
    const passwordMatch = user && await bcrypt.compare(password, user.password);
    if (!user || !passwordMatch)
      return res.status(401).json({ success: false, error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });

    const accessToken  = signAccessToken({ id: user.id, email: user.email });
    const refreshToken = signRefreshToken({ id: user.id, email: user.email });

    // Store refresh token in DB
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id },
    });

    res.json({
      success: true,
      token:        accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (e) { next(e); }
});

// ── POST /api/auth/refresh ─────────────────────────────────────────────────
// Issues a new access token using a valid refresh token.
// FIX: Solves "user gets silently logged out after 7 days" problem.
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ success: false, error: 'Refresh token required', code: 'MISSING_REFRESH_TOKEN' });

    // Verify the refresh token signature + expiry
    let payload;
    try {
      payload = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh'
      );
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid or expired refresh token', code: 'INVALID_REFRESH_TOKEN' });
    }

    // Check it exists in DB (not logged out / revoked)
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored)
      return res.status(401).json({ success: false, error: 'Refresh token revoked', code: 'REVOKED_REFRESH_TOKEN' });

    // Issue a fresh access token
    const newAccessToken = signAccessToken({ id: payload.id, email: payload.email });

    res.json({ success: true, token: newAccessToken });
  } catch (e) { next(e); }
});

// ── POST /api/auth/logout ──────────────────────────────────────────────────
// Revokes the refresh token so it can't be used to get new access tokens.
// FIX: True server-side logout (not just frontend localStorage clear).
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Delete this specific refresh token
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken, userId: req.user.id } });
    } else {
      // No token given — logout all sessions (delete ALL refresh tokens for this user)
      await prisma.refreshToken.deleteMany({ where: { userId: req.user.id } });
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (e) { next(e); }
});

// ── GET /api/auth/me ───────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { id: true, name: true, email: true, avatar: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user });
  } catch (e) { next(e); }
});

module.exports = router;
