const router       = require('express').Router();
const { z }        = require('zod');
const prisma       = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');

// All routes in this file require a valid JWT token
router.use(authenticate);

// ── Zod schemas ─────────────────────────────────────────────────────────────
const progressSchema = z.object({
  questionId: z.number({ coerce: true }).int().positive('questionId must be a positive integer'),
  status:     z.enum(['solved', 'attempted', 'not-started'], {
                errorMap: () => ({ message: 'status must be: solved | attempted | not-started' }),
              }),
  notes:      z.string().optional(),  // optional personal notes (M3)
});

// ── GET /api/progress ──────────────────────────────────────────────────────
// Returns paginated progress records for the logged-in user. (M2: added pagination)
// Query params: page (default 1), limit (default 50, max 200), status (filter)
router.get('/', async (req, res, next) => {
  try {
    const page    = Math.max(1, Number(req.query.page)  || 1);
    const limit   = Math.min(Math.max(1, Number(req.query.limit) || 50), 200);
    const status  = req.query.status; // optional filter: solved | attempted | not-started

    const where = {
      userId: req.user.id,
      ...(status && { status }),
    };

    const [progress, total] = await Promise.all([
      prisma.progress.findMany({
        where,
        include:  { question: { select: { slug: true, title: true, difficulty: true } } },
        orderBy:  { updatedAt: 'desc' },
        take:     limit,
        skip:     (page - 1) * limit,
      }),
      prisma.progress.count({ where }),
    ]);

    res.json({
      success: true,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      progress,
    });
  } catch (e) { next(e); }
});

// ── POST /api/progress ─────────────────────────────────────────────────────
// Upsert the status (and optionally notes) for a single question. (M3: notes support)
// Body: { questionId: 3, status: "solved", notes?: "My notes here" }
router.post('/', async (req, res, next) => {
  try {
    const { questionId, status, notes } = progressSchema.parse(req.body);

    const updateData  = { status };
    const createData  = { userId: req.user.id, questionId, status };

    // notes — only update if explicitly provided in the request body
    if (notes !== undefined) {
      updateData.notes = notes;
      createData.notes = notes;
    }

    // Set solvedAt once when status first becomes "solved"
    if (status === 'solved') {
      const existing = await prisma.progress.findUnique({
        where:  { userId_questionId: { userId: req.user.id, questionId } },
        select: { solvedAt: true },
      });
      // Only set solvedAt if it hasn't been set before (preserve original solve time)
      if (!existing?.solvedAt) {
        updateData.solvedAt = new Date();
        createData.solvedAt = new Date();
      }
    }

    const progress = await prisma.progress.upsert({
      where:  { userId_questionId: { userId: req.user.id, questionId } },
      update: updateData,
      create: createData,
    });

    res.json({ success: true, progress });
  } catch (e) { next(e); }
});

// ── PATCH /api/progress/:questionId/notes ─────────────────────────────────
// Update only the notes for a question — without changing the status. (M3)
// Body: { notes: "My thinking here..." }
router.patch('/:questionId/notes', async (req, res, next) => {
  try {
    const questionId = Number(req.params.questionId);
    if (isNaN(questionId) || questionId < 1)
      return res.status(400).json({ success: false, error: 'Invalid questionId' });

    const { notes } = z.object({ notes: z.string() }).parse(req.body);

    const progress = await prisma.progress.update({
      where: { userId_questionId: { userId: req.user.id, questionId } },
      data:  { notes },
    });

    res.json({ success: true, progress });
  } catch (e) { next(e); }
});

// ── POST /api/progress/bulk ────────────────────────────────────────────────
// Bulk progress fetch — get statuses for a list of question IDs.
// Body:    { questionIds: [3, 7, 15, 22, ...] }   (max 500)
// Returns: Map of questionId → { status, notes }
router.post('/bulk', async (req, res, next) => {
  try {
    const { questionIds } = req.body;

    if (!Array.isArray(questionIds) || questionIds.length === 0)
      return res.status(400).json({ success: false, error: 'questionIds must be a non-empty array' });

    if (questionIds.length > 500)
      return res.status(400).json({ success: false, error: 'Cannot fetch more than 500 questions at once' });

    const records = await prisma.progress.findMany({
      where:  { userId: req.user.id, questionId: { in: questionIds.map(Number) } },
      select: { questionId: true, status: true, notes: true, solvedAt: true },
    });

    // { "3": { status: "solved", notes: "..." }, "7": { status: "attempted", notes: null } }
    const progress = Object.fromEntries(
      records.map(r => [r.questionId, { status: r.status, notes: r.notes, solvedAt: r.solvedAt }])
    );

    res.json({ success: true, progress });
  } catch (e) { next(e); }
});

module.exports = router;
