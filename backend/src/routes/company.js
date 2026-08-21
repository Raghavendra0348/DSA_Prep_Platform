const router       = require('express').Router();
const prisma       = require('../lib/prisma');
const jwt          = require('jsonwebtoken');

// ── Constants ──────────────────────────────────────────────────────────────
const VALID_PERIODS = ['30days', '3months', '6months', '6plus', 'all'];
const VALID_SORT    = ['frequency', 'acceptanceRate', 'difficulty', 'title'];
const VALID_DIFF    = ['EASY', 'MEDIUM', 'HARD'];

// ── Optional Auth Helper ───────────────────────────────────────────────────
// Unlike authenticate middleware (which blocks unauthenticated users),
// this silently decodes the token IF present — allowing the route to
// return richer data (status, bookmarked) for logged-in users,
// while still working for anonymous users.
function optionalAuth(req) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) return jwt.verify(token, process.env.JWT_SECRET);
  } catch { /* invalid/expired token — treat as anonymous */ }
  return null;
}

// ── GET /api/company/:slug ─────────────────────────────────────────────────
// Returns paginated, filtered problem list for one company.
//
// Query params:
//   period     = 30days | 3months | 6months | 6plus | all (default: all)
//   difficulty = EASY,MEDIUM,HARD  (comma-separated, optional)
//   topics     = Array,String       (comma-separated, optional)
//   sortBy     = frequency | acceptanceRate | difficulty | title (default: frequency)
//   page       = 1, 2, 3...
//   limit      = max 200
//
// A6 improvement: When user is authenticated, each problem also includes:
//   status     = "solved" | "attempted" | "not-started"
//   bookmarked = true | false
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const {
      period     = 'all',
      difficulty,
      topics,
      sortBy     = 'frequency',
      page       = 1,
      limit      = 50,
    } = req.query;

    // ── Validation ──────────────────────────────────────────────
    if (!VALID_PERIODS.includes(period))
      return res.status(400).json({ error: 'Invalid period. Must be: 30days | 3months | 6months | 6plus | all' });

    if (sortBy && !VALID_SORT.includes(sortBy))
      return res.status(400).json({ error: `Invalid sortBy. Must be one of: ${VALID_SORT.join(' | ')}` });

    const pageNum  = Math.max(1, Number(page)  || 1);
    const limitNum = Math.min(Math.max(1, Number(limit) || 50), 200);

    // ── Validate difficulty filter ───────────────────────────────
    let difficultyFilter;
    if (difficulty) {
      difficultyFilter = difficulty.toUpperCase().split(',').map(d => d.trim());
      const invalid = difficultyFilter.filter(d => !VALID_DIFF.includes(d));
      if (invalid.length)
        return res.status(400).json({ error: `Invalid difficulty: ${invalid.join(', ')}. Use EASY, MEDIUM, HARD` });
    }

    // ── Validate topics filter ───────────────────────────────────
    // A3: Topics filtering was previously ignored (the variable was extracted
    // from query params but never used in the WHERE clause). Fixed here.
    let topicsFilter;
    if (topics) {
      topicsFilter = topics.split(',').map(t => t.trim()).filter(Boolean);
    }

    // ── Find Company ─────────────────────────────────────────────
    const company = await prisma.company.findUnique({ where: { slug } });
    if (!company)
      return res.status(404).json({ error: 'Company not found', code: 'COMPANY_NOT_FOUND' });

    // ── Build WHERE clause ────────────────────────────────────────
    // CompanyQuestion filter: companyId + period (required)
    // Question filter: difficulty + topics (optional)
    const questionFilter = {
      ...(difficultyFilter && { difficulty: { in: difficultyFilter } }),
      // A3: Topics filter — question must have ALL specified topics
      // hasSome = has at least one of the topics
      ...(topicsFilter && topicsFilter.length > 0 && { topics: { hasSome: topicsFilter } }),
    };

    const where = {
      companyId: company.id,
      period,
      // Only add question filter if we have actual conditions
      ...(Object.keys(questionFilter).length > 0 && { question: questionFilter }),
    };

    // ── Parallel DB Queries ───────────────────────────────────────
    const [rows, total] = await Promise.all([
      prisma.companyQuestion.findMany({
        where,
        include: { question: true },
        // A3: Full sort support including title
        orderBy: sortBy === 'difficulty'
          ? { question: { difficulty: 'asc' } }   // EASY < HARD < MEDIUM alphabetically — use question relation
          : sortBy === 'title'
            ? { question: { title: 'asc' } }
            : { [sortBy]: 'desc' },                // frequency | acceptanceRate
        take: limitNum,
        skip: (pageNum - 1) * limitNum,
      }),
      prisma.companyQuestion.count({ where }),
    ]);

    // ── A6: Optional auth — enrich with user progress + bookmarks ──
    // Check if user is logged in. If yes, fetch their progress + bookmarks
    // for all returned question IDs in ONE batch query each.
    const user = optionalAuth(req);
    let progressMap  = {};
    let bookmarkSet  = new Set();

    if (user) {
      const questionIds = rows.map(r => r.questionId);

      const [progressRecords, bookmarkRecords] = await Promise.all([
        prisma.progress.findMany({
          where:  { userId: user.id, questionId: { in: questionIds } },
          select: { questionId: true, status: true },
        }),
        prisma.bookmark.findMany({
          where:  { userId: user.id, questionId: { in: questionIds } },
          select: { questionId: true },
        }),
      ]);

      // Convert to O(1) lookup structures
      progressMap = Object.fromEntries(progressRecords.map(p => [p.questionId, p.status]));
      bookmarkSet = new Set(bookmarkRecords.map(b => b.questionId));
    }

    // ── Build Response ───────────────────────────────────────────
    const problems = rows.map(r => ({
      id:             r.question.id,
      slug:           r.question.slug,
      title:          r.question.title,
      difficulty:     r.question.difficulty,
      link:           r.question.link,
      topics:         r.question.topics,
      frequency:      r.frequency,
      acceptanceRate: r.acceptanceRate,
      // A6: Only included if user is authenticated; null otherwise
      status:         user ? (progressMap[r.questionId] || 'not-started') : null,
      bookmarked:     user ? bookmarkSet.has(r.questionId) : null,
    }));

    res.json({
      success: true,
      company: company.name,
      slug:    company.slug,
      period,
      authenticated: !!user,
      pagination: {
        page:       pageNum,
        limit:      limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      problems,
    });
  } catch (e) { next(e); }
});

// ── GET /api/company/:slug/stats ───────────────────────────────────────────
// Returns difficulty + topic breakdown per time period.
//
// PERF: Previously fired 5 findMany queries, each loading ALL CompanyQuestion
// rows for a period just to count them in JS. Now uses 2 raw SQL queries that
// let PostgreSQL do the aggregation — goes from O(N_rows × 5) to O(1).
router.get('/:slug/stats', async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({ where: { slug: req.params.slug } });
    if (!company) return res.status(404).json({ error: 'Company not found' });

    // ── 2 queries instead of 5 findMany calls ─────────────────────────────
    // Query 1: difficulty counts grouped by period — DB does the counting
    // Query 2: topic frequencies via unnest() — DB explodes the array and counts
    const [diffRows, topicRows] = await Promise.all([
      prisma.$queryRaw`
        SELECT cq.period, q.difficulty, COUNT(*)::int AS count
        FROM   "CompanyQuestion" cq
        JOIN   "Question" q ON q.id = cq."questionId"
        WHERE  cq."companyId" = ${company.id}
        GROUP  BY cq.period, q.difficulty
      `,
      prisma.$queryRaw`
        SELECT cq.period, unnest(q.topics) AS topic, COUNT(*)::int AS count
        FROM   "CompanyQuestion" cq
        JOIN   "Question" q ON q.id = cq."questionId"
        WHERE  cq."companyId" = ${company.id}
        GROUP  BY cq.period, topic
        ORDER  BY cq.period, count DESC
      `,
    ]);

    // ── Assemble stats object from flat result rows ─────────────────────────
    const PERIODS = ['30days', '3months', '6months', '6plus', 'all'];
    const stats   = {};

    for (const period of PERIODS) {
      const diffs = diffRows.filter(r => r.period === period);
      if (!diffs.length) continue;

      const get = (diff) => diffs.find(r => r.difficulty === diff)?.count ?? 0;

      stats[period] = {
        total:     diffs.reduce((s, r) => s + r.count, 0),
        easy:      get('EASY'),
        medium:    get('MEDIUM'),
        hard:      get('HARD'),
        topTopics: topicRows
          .filter(r => r.period === period)
          .slice(0, 5)
          .map(r => r.topic),
      };
    }

    res.json({ success: true, company: company.name, stats });
  } catch (e) { next(e); }
});

module.exports = router;
