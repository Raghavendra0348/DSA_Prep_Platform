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

const crypto        = require('crypto');
const { sendVerificationOtp } = require('../lib/mailer');

// ── Disposable Email Domains Blocklist ─────────────────────────────────────
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
  'throwawaymail.com', 'temp-mail.org', 'sharklasers.com', 'yopmail.com',
  'dispostable.com', 'getairmail.com', 'fakeinbox.com', 'trashmail.com'
]);

function isDisposableEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false;
}

// ── Cryptographic OTP Hash Helper (Protects codes at rest in PostgreSQL) ───
function hashOtp(code) {
  return crypto.createHash('sha256').update(code.trim()).digest('hex');
}

// ── Sanitize Text (Prevent XSS and strip control characters) ───────────────
function sanitizeText(str) {
  return str.replace(/<[^>]*>?/gm, '').trim();
}

// ── Zod schemas with strict sanitization ───────────────────────────────────
const registerSchema = z.object({
  email:    z.string().email({ message: 'Invalid email format' }).max(254),
  name:     z.string().trim().min(1, { message: 'Name cannot be empty' }).max(60),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }).max(128),
});

const sendOtpSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }).max(254),
});

const verifyAndRegisterSchema = z.object({
  email:    z.string().email({ message: 'Invalid email format' }).max(254),
  name:     z.string().trim().min(1, { message: 'Name cannot be empty' }).max(60),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }).max(128),
  code:     z.string().trim().regex(/^\d{6}$/, { message: 'Verification code must be 6 digits' }),
});

const loginSchema = z.object({
  email:    z.string().email({ message: 'Invalid email format' }).max(254),
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

// ── POST /api/auth/send-otp ────────────────────────────────────────────────
// Dispatches a 6-digit OTP code to the requested email for signup verification
router.post('/send-otp', async (req, res, next) => {
  try {
    const { email } = sendOtpSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    // Check disposable email
    if (isDisposableEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Disposable email addresses are not allowed. Please use a permanent email.',
        code: 'DISPOSABLE_EMAIL',
      });
    }

    // Check if email already registered
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists. Please log in.',
        code: 'EMAIL_EXISTS',
      });
    }

    // Rate-limit check: Cooldown of 40 seconds between requests
    const recent = await prisma.verificationCode.findFirst({
      where: {
        email: normalizedEmail,
        createdAt: { gte: new Date(Date.now() - 40 * 1000) },
      },
    });
    if (recent) {
      return res.status(429).json({
        success: false,
        error: 'Please wait a moment before requesting another code.',
        code: 'TOO_MANY_REQUESTS',
      });
    }

    // Clean up older verification codes for this email
    await prisma.verificationCode.deleteMany({
      where: { email: normalizedEmail },
    });

    // CSPRNG: Cryptographically secure 6-digit numeric OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const codeHash = hashOtp(rawOtp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save hashed OTP to DB
    await prisma.verificationCode.create({
      data: {
        email: normalizedEmail,
        code: codeHash,
        attempts: 0,
        expiresAt,
      },
    });

    // Send plaintext OTP via email
    await sendVerificationOtp(normalizedEmail, rawOtp);

    res.json({
      success: true,
      message: 'Verification code sent to your email address.',
    });
  } catch (e) { next(e); }
});

// ── POST /api/auth/resend-otp ──────────────────────────────────────────────
router.post('/resend-otp', async (req, res, next) => {
  try {
    const { email } = sendOtpSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    if (isDisposableEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Disposable email addresses are not allowed.',
        code: 'DISPOSABLE_EMAIL',
      });
    }

    // Check if already registered
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists.',
        code: 'EMAIL_EXISTS',
      });
    }

    // Cooldown check (40s)
    const recent = await prisma.verificationCode.findFirst({
      where: {
        email: normalizedEmail,
        createdAt: { gte: new Date(Date.now() - 40 * 1000) },
      },
    });
    if (recent) {
      return res.status(429).json({
        success: false,
        error: 'Please wait before requesting a new code.',
        code: 'TOO_MANY_REQUESTS',
      });
    }

    await prisma.verificationCode.deleteMany({
      where: { email: normalizedEmail },
    });

    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const codeHash = hashOtp(rawOtp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.verificationCode.create({
      data: {
        email: normalizedEmail,
        code: codeHash,
        attempts: 0,
        expiresAt,
      },
    });

    await sendVerificationOtp(normalizedEmail, rawOtp);

    res.json({
      success: true,
      message: 'A fresh verification code has been sent.',
    });
  } catch (e) { next(e); }
});

// ── POST /api/auth/verify-and-register ─────────────────────────────────────
// Verifies the 6-digit OTP code and creates the user account with brute-force lockout
router.post('/verify-and-register', async (req, res, next) => {
  try {
    const { email, name, password, code } = verifyAndRegisterSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();
    const sanitizedName = sanitizeText(name);

    // Double check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists.',
        code: 'EMAIL_EXISTS',
      });
    }

    // Find valid unexpired OTP record
    const verificationRecord = await prisma.verificationCode.findFirst({
      where: {
        email: normalizedEmail,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verificationRecord) {
      return res.status(400).json({
        success: false,
        error: 'Verification code has expired or was not requested. Please request a new code.',
        code: 'INVALID_OTP',
      });
    }

    // Brute-force protection: Max 5 attempts per OTP
    if (verificationRecord.attempts >= 5) {
      await prisma.verificationCode.deleteMany({ where: { email: normalizedEmail } });
      return res.status(429).json({
        success: false,
        error: 'Too many incorrect attempts. This code has been invalidated. Please request a new code.',
        code: 'TOO_MANY_ATTEMPTS',
      });
    }

    // Verify hash match
    const providedHash = hashOtp(code);
    if (providedHash !== verificationRecord.code) {
      const nextAttempts = verificationRecord.attempts + 1;
      const remaining = 5 - nextAttempts;

      if (remaining <= 0) {
        await prisma.verificationCode.deleteMany({ where: { email: normalizedEmail } });
        return res.status(400).json({
          success: false,
          error: 'Too many incorrect attempts. Code invalidated. Please request a new code.',
          code: 'TOO_MANY_ATTEMPTS',
        });
      }

      await prisma.verificationCode.update({
        where: { id: verificationRecord.id },
        data: { attempts: { increment: 1 } },
      });

      return res.status(400).json({
        success: false,
        error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        code: 'INVALID_OTP',
        remainingAttempts: remaining,
      });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Atomic transaction: Create user, delete OTPs, create refresh token
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          name: sanitizedName,
          password: hashed,
          authProvider: 'email',
        },
      });

      await tx.verificationCode.deleteMany({
        where: { email: normalizedEmail },
      });

      const accessToken  = signAccessToken({ id: user.id, email: user.email });
      const refreshToken = signRefreshToken({ id: user.id, email: user.email });

      await tx.refreshToken.create({
        data: { token: refreshToken, userId: user.id },
      });

      return { user, accessToken, refreshToken };
    });

    res.status(201).json({
      success: true,
      token: result.accessToken,
      refreshToken: result.refreshToken,
      user: { id: result.user.id, name: result.user.name, email: result.user.email },
    });
  } catch (e) { next(e); }
});


// ── POST /api/auth/register (Direct Fallback) ──────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { email, name, password } = registerSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) return res.status(409).json({ success: false, error: 'Email already registered', code: 'EMAIL_EXISTS' });

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email: normalizedEmail, name: name.trim(), password: hashed, authProvider: 'email' },
    });

    const accessToken  = signAccessToken({ id: user.id, email: user.email });
    const refreshToken = signRefreshToken({ id: user.id, email: user.email });

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
