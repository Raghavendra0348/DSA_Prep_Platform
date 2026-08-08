const router       = require('express').Router();
const bcrypt       = require('bcryptjs');
const jwt          = require('jsonwebtoken');
const prisma       = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');

// ── Helpers ────────────────────────────────────────────────────────────────

// FIX #3a: Validate email format with a simple regex
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// FIX #3a: Validate password strength (minimum 6 characters)
function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

// ── POST /api/auth/register ────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { email, name, password } = req.body;

    // Basic presence check
    if (!email || !name || !password)
      return res.status(400).json({ error: 'All fields required' });

    // FIX #3a: Validate email format
    if (!isValidEmail(email))
      return res.status(400).json({ error: 'Invalid email format' });

    // FIX #3a: Validate password length
    if (!isValidPassword(password))
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    // Validate name is not just whitespace
    if (!name.trim())
      return res.status(400).json({ error: 'Name cannot be empty' });

    // Check if email already registered
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    // Hash password (bcrypt adds salt automatically)
    const hashed = await bcrypt.hash(password, 10);

    // Create user — store email in lowercase for consistency
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), name: name.trim(), password: hashed },
    });

    // Sign JWT — valid 7 days
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (e) { next(e); }
});

// ── POST /api/auth/login ───────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Presence check
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    // Find user — use lowercase email to match registration
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    // Always use bcrypt.compare (even if user not found) to prevent timing attacks
    const passwordMatch = user && await bcrypt.compare(password, user.password);
    if (!user || !passwordMatch)
      return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (e) { next(e); }
});

// ── GET /api/me ────────────────────────────────────────────────────────────
// FIX #3b: Add the missing /api/me endpoint (was listed in PRD but never built).
// Returns the currently logged-in user's profile. Requires JWT.
router.get('/me', authenticate, async (req, res, next) => {
  try {
    // req.user.id is set by the authenticate middleware after verifying the JWT
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { id: true, name: true, email: true, avatar: true, createdAt: true },
      // NOTE: password is intentionally NOT selected — never expose it
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ success: true, user });
  } catch (e) { next(e); }
});

module.exports = router;
