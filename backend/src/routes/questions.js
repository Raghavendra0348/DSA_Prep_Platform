const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// ── Optional Auth Helper (same pattern as company.js) ──────────────────────
function optionalAuth(req) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) return jwt.verify(token, process.env.JWT_SECRET);
  } catch { /* invalid/expired token — treat as anonymous */ }
  return null;
}

// ── GET /api/questions/:slug ───────────────────────────────────────────────
// Returns full details of a single question.
// FIX: Was previously missing — frontend had no way to view a problem's
//      full info (all companies that asked it, topics, user status).
//
// When authenticated, also returns:
//   status     — user's progress on this problem
//   bookmarked — whether user has bookmarked it
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;

    // Fetch question with all companies that asked it
    const question = await prisma.question.findUnique({
      where:   { slug },
      include: {
        companies: {
          where:   { period: 'all' },           // only "all-time" for the company list
          orderBy: { frequency: 'desc' },
          include: { company: { select: { name: true, slug: true } } },
        },
      },
    });

    if (!question)
      return res.status(404).json({ success: false, error: 'Question not found', code: 'NOT_FOUND' });

    // ── Optional auth — enrich with user progress + bookmark ──────────────
    const user = optionalAuth(req);
    let status     = null;
    let bookmarked = null;

    if (user) {
      const [progressRecord, bookmarkRecord] = await Promise.all([
        prisma.progress.findUnique({
          where:  { userId_questionId: { userId: user.id, questionId: question.id } },
          select: { status: true },
        }),
        prisma.bookmark.findUnique({
          where:  { userId_questionId: { userId: user.id, questionId: question.id } },
          select: { questionId: true },
        }),
      ]);

      status     = progressRecord?.status || 'not-started';
      bookmarked = !!bookmarkRecord;
    }

    // ── Shape the companies list ───────────────────────────────────────────
    const askedByCompanies = question.companies.map(cq => ({
      name:          cq.company.name,
      slug:          cq.company.slug,
      frequency:     cq.frequency,
      acceptanceRate: cq.acceptanceRate,
    }));

    res.json({
      success: true,
      question: {
        id:             question.id,
        slug:           question.slug,
        title:          question.title,
        difficulty:     question.difficulty,
        link:           question.link,
        topics:         question.topics,
        companyCount:   askedByCompanies.length,
        companies:      askedByCompanies,
        // Auth-enriched fields (null if not logged in)
        status,
        bookmarked,
      },
    });
  } catch (e) { next(e); }
});

module.exports = router;
