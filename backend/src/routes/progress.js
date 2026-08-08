const router       = require('express').Router();
const prisma       = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');

// All routes in this file require a valid JWT token
router.use(authenticate);

// ── GET /api/progress ──────────────────────────────────────────────────────
// Returns all progress records for the logged-in user.
// Used by: Dashboard page to show overall stats.
router.get('/', async (req, res, next) => {
  try {
    const progress = await prisma.progress.findMany({
      where:   { userId: req.user.id },
      include: { question: { select: { slug: true, title: true } } },
    });
    res.json({ success: true, progress });
  } catch (e) { next(e); }
});

// ── POST /api/progress ─────────────────────────────────────────────────────
// Upsert the status of a single question for the logged-in user.
// Used by: Company detail page — when user clicks to mark a problem solved.
// Body: { questionId: 3, status: "solved" }
router.post('/', async (req, res, next) => {
  try {
    const { questionId, status } = req.body;
    const validStatuses = ['solved', 'attempted', 'not-started'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ error: 'Invalid status. Must be: solved | attempted | not-started' });

    if (!questionId || isNaN(Number(questionId)))
      return res.status(400).json({ error: 'questionId must be a valid number' });

    const progress = await prisma.progress.upsert({
      where:  { userId_questionId: { userId: req.user.id, questionId: Number(questionId) } },
      update: { status },
      create: { userId: req.user.id, questionId: Number(questionId), status },
    });
    res.json({ success: true, progress });
  } catch (e) { next(e); }
});

// ── POST /api/progress/bulk ────────────────────────────────────────────────
// FIX #5: Bulk progress fetch — get statuses for a list of question IDs.
//
// WHY this is needed:
//   Company page shows 172 Google problems. Frontend needs to show which
//   ones are solved/attempted. Without this endpoint, it would need 172
//   separate API calls. With this, it sends ONE request with all IDs.
//
// Body:    { questionIds: [3, 7, 15, 22, ...] }
// Returns: Map of questionId → status (only for questions the user has touched)
//          Questions with no record are simply absent (meaning "not-started")
//
// Example:
//   Request:  { questionIds: [3, 7, 15] }
//   Response: { progress: { "3": "solved", "7": "attempted" } }
//             (15 is absent → user hasn't started it)
router.post('/bulk', async (req, res, next) => {
  try {
    const { questionIds } = req.body;

    if (!Array.isArray(questionIds) || questionIds.length === 0)
      return res.status(400).json({ error: 'questionIds must be a non-empty array' });

    // Cap at 500 IDs to prevent abuse
    if (questionIds.length > 500)
      return res.status(400).json({ error: 'Cannot fetch more than 500 questions at once' });

    const records = await prisma.progress.findMany({
      where: {
        userId:     req.user.id,
        questionId: { in: questionIds.map(Number) },  // Prisma IN clause
      },
      select: { questionId: true, status: true },
    });

    // Convert array to a map for O(1) lookup on the frontend:
    // [{ questionId: 3, status: "solved" }]  →  { "3": "solved" }
    const progress = Object.fromEntries(records.map(r => [r.questionId, r.status]));

    res.json({ success: true, progress });
  } catch (e) { next(e); }
});

module.exports = router;

