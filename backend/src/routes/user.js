const router       = require('express').Router();
const bcrypt       = require('bcryptjs');
const { z }        = require('zod');
const prisma       = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');

// All routes require auth
router.use(authenticate);

// ── Zod schemas ─────────────────────────────────────────────────────────────
const updateProfileSchema = z.object({
  name:   z.string().trim().min(1, 'Name cannot be empty').optional(),
  avatar: z.string().url('Avatar must be a valid URL').optional().nullable(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword:     z.string().min(6, 'New password must be at least 6 characters'),
});

// ── GET /api/me ────────────────────────────────────────────────────────────
// Returns the logged-in user's profile
router.get('/', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { id: true, name: true, email: true, avatar: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user });
  } catch (e) { next(e); }
});

// ── PUT /api/me ────────────────────────────────────────────────────────────
// Update name and/or avatar.
// FIX: Was previously missing — profile page had no save functionality.
//
// Body: { name?: string, avatar?: string | null }
router.put('/', async (req, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);

    // Reject empty updates — nothing to change
    if (Object.keys(data).length === 0)
      return res.status(400).json({ success: false, error: 'No fields to update', code: 'EMPTY_UPDATE' });

    const user = await prisma.user.update({
      where:  { id: req.user.id },
      data,
      select: { id: true, name: true, email: true, avatar: true, createdAt: true },
    });

    res.json({ success: true, user });
  } catch (e) { next(e); }
});

// ── PUT /api/me/password ───────────────────────────────────────────────────
// Change password — requires current password verification.
// FIX: Was previously missing — no way to change password.
//
// Body: { currentPassword: string, newPassword: string }
router.put('/password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    // Fetch user with password (not normally selected)
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    // Verify current password before allowing change
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, error: 'Current password is incorrect', code: 'WRONG_PASSWORD' });

    // Don't allow setting same password
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame)
      return res.status(400).json({ success: false, error: 'New password must be different from current password', code: 'SAME_PASSWORD' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

    // Revoke all existing refresh tokens — force re-login everywhere
    await prisma.refreshToken.deleteMany({ where: { userId: req.user.id } });

    res.json({ success: true, message: 'Password changed. Please log in again.' });
  } catch (e) { next(e); }
});

module.exports = router;
