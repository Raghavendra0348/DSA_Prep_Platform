const router       = require('express').Router();
const prisma       = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

// ── GET /api/bookmarks ────────────────────────────────────────────────────
// Returns paginated bookmarks for the logged-in user. (M2: added pagination)
// Query params: page (default 1), limit (default 20, max 100)
router.get('/', async (req, res, next) => {
  try {
    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(Math.max(1, Number(req.query.limit) || 20), 100);

    const where = { userId: req.user.id };

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where,
        include: {
          question: {
            select: { id: true, slug: true, title: true, difficulty: true, topics: true, link: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take:    limit,
        skip:    (page - 1) * limit,
      }),
      prisma.bookmark.count({ where }),
    ]);

    res.json({
      success: true,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      bookmarks,
    });
  } catch (e) { next(e); }
});

// ── POST /api/bookmarks ───────────────────────────────────────────────────
// Toggle a bookmark on/off (idempotent).
// Body: { questionId: number }
router.post('/', async (req, res, next) => {
  try {
    const questionId = Number(req.body.questionId);
    if (!questionId || isNaN(questionId))
      return res.status(400).json({ success: false, error: 'questionId must be a valid number' });

    const key    = { userId: req.user.id, questionId };
    const exists = await prisma.bookmark.findUnique({ where: { userId_questionId: key } });

    if (exists) {
      await prisma.bookmark.delete({ where: { userId_questionId: key } });
      return res.json({ success: true, bookmarked: false });
    }

    await prisma.bookmark.create({ data: key });
    res.json({ success: true, bookmarked: true });
  } catch (e) { next(e); }
});

module.exports = router;
