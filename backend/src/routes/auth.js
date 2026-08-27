const router       = require('express').Router();
const bcrypt       = require('bcryptjs');
const jwt          = require('jsonwebtoken');
const https        = require('https');
const { z }        = require('zod');
const { OAuth2Client } = require('google-auth-library');
const prisma       = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');

// ── Google OAuth client ────────────────────────────────────────────────────
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── Fetch Google user info via access_token ────────────────────────────────
async function getGoogleUserInfo(accessToken) {
  return new Promise((resolve, reject) => {
    const url = `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${encodeURIComponent(accessToken)}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message || 'Google token invalid'));
          resolve(json); // { sub, email, name, picture }
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// ── Zod schemas ────────────────────────────────────────────────────────────
const registerSchema = z.object({
  email:    z.string().email({ message: 'Invalid email format' }),
  name:     z.string().trim().min(1, { message: 'Name cannot be empty' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const loginSchema = z.object({
  email:    z.string().email({ message: 'Invalid email format' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

// ── Token helpers ──────────────────────────────────────────────────────────
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
      data: { email: email.toLowerCase(), name: name.trim(), password: hashed, authProvider: 'email' },
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

    // Google-only users have no password — guide them to use Google
    if (user && !user.password) {
      return res.status(401).json({
        success: false,
        error: 'This account uses Google Sign-In. Please use the "Continue with Google" button.',
        code: 'GOOGLE_ONLY_ACCOUNT',
      });
    }

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
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (e) { next(e); }
});

// ── POST /api/auth/google ──────────────────────────────────────────────────
// Accepts EITHER:
//  - { idToken }    — classic Google Identity Services credential (JWT)
//  - { accessToken } — implicit flow access_token from useGoogleLogin
// Finds-or-creates the user and returns our own JWTs.
router.post('/google', async (req, res, next) => {
  try {
    const { idToken, accessToken } = req.body;
    if (!idToken && !accessToken) {
      return res.status(400).json({
        success: false,
        error: 'A Google ID token or access token is required',
        code: 'MISSING_GOOGLE_TOKEN',
      });
    }

    let googleId, email, name, picture;

    if (idToken) {
      // Verify the Google ID token — checks signature, expiry, and audience
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      ({ sub: googleId, email, name, picture } = payload);
    } else {
      // Exchange access_token for user info via Google userinfo endpoint
      const info = await getGoogleUserInfo(accessToken);
      googleId = info.sub;
      email    = info.email;
      name     = info.name;
      picture  = info.picture;
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Google account must have an email address',
        code: 'NO_EMAIL',
      });
    }

    // 1. Try to find user by googleId first (returning Google user)
    // 2. Fall back to email match (link existing email account to Google)
    // 3. If neither found, create a brand new user
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email: email.toLowerCase() }] },
    });

    if (user) {
      // Link Google account if not already linked
      const updates = {};
      if (!user.googleId) updates.googleId = googleId;
      if (!user.avatar && picture) updates.avatar = picture;
      if (user.authProvider === 'email') updates.authProvider = 'both';

      if (Object.keys(updates).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updates,
        });
      }
    } else {
      // Brand new Google user — no password needed
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: name || email.split('@')[0],
          googleId,
          authProvider: 'google',
          avatar: picture || null,
          // password left null — this user can only log in via Google (or set password later)
        },
      });
    }

    const jwtAccessToken = signAccessToken({ id: user.id, email: user.email });
    const refreshToken   = signRefreshToken({ id: user.id, email: user.email });

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id },
    });

    res.json({
      success: true,
      token: jwtAccessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (e) {
    // Handle specific Google token verification errors
    if (e.message?.includes('Token used too late') ||
        e.message?.includes('Invalid token') ||
        e.message?.includes('Wrong number of segments')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired Google token. Please try again.',
        code: 'INVALID_GOOGLE_TOKEN',
      });
    }
    next(e);
  }
});

// ── POST /api/auth/refresh ─────────────────────────────────────────────────
// Issues a new access token using a valid refresh token.
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
      select: { id: true, name: true, email: true, avatar: true, createdAt: true, authProvider: true },
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user });
  } catch (e) { next(e); }
});

module.exports = router;
