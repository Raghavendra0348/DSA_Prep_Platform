const router = require('express').Router();
const prisma  = require('../lib/prisma');
const jwt     = require('jsonwebtoken');

// ── Optional Auth Helper ──────────────────────────────────────────────────────
// Silently decodes the Bearer token if present — lets the route return
// status + bookmarked for logged-in users while still working anonymously.
function optionalAuth(req) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) return jwt.verify(token, process.env.JWT_SECRET);
  } catch { /* invalid/expired token — treat as anonymous */ }
  return null;
}

router.get('/', async (req, res, next) => {
  try {
    const questions = await prisma.question.findMany({ select: { topics: true } });
    const map = {};
    questions.forEach(q => q.topics.forEach(t => map[t] = (map[t]||0)+1));
    const topics = Object.entries(map)
      .sort((a,b) => b[1]-a[1])
      .map(([name, count]) => ({ name, slug: name.toLowerCase().replace(/\s+/g,'-'), problemCount: count }));
    res.json({ success: true, total: topics.length, topics });
  } catch (e) { next(e); }
});

router.get('/:topic', async (req, res, next) => {
  try {
    const { topic } = req.params;
    const { page = 1, limit = 50, difficulty } = req.query;

    // FIX: Slug "dynamic-programming" becomes "dynamic programming" (lowercase).
    // But DB stores "Dynamic Programming" (title case from CSV).
    // Solution: fetch all distinct topic names from DB, then find the one
    // whose slug matches — this gives us the exact casing stored in the DB.
    const allQuestions   = await prisma.question.findMany({ select: { topics: true } });
    const topicSet       = new Set(allQuestions.flatMap(q => q.topics));
    const topicSlug      = topic.toLowerCase();
    const resolvedTopic  = [...topicSet].find(
      t => t.toLowerCase().replace(/\s+/g, '-') === topicSlug
    );

    // If no matching topic found, return 404 instead of empty results
    if (!resolvedTopic)
      return res.status(404).json({ success: false, error: `Topic '${topic}' not found` });

    // Parse comma-separated difficulty filter (e.g. EASY,MEDIUM or MEDIUM,EASY)
    let difficultyFilter;
    if (difficulty) {
      const parsed = difficulty.toUpperCase().split(',').map(d => d.trim()).filter(Boolean);
      if (parsed.length > 0) {
        difficultyFilter = { in: parsed };
      }
    }

    const where = {
      topics: { has: resolvedTopic },          // exact DB value, correct casing
      ...(difficultyFilter && { difficulty: difficultyFilter }),
    };

    const statsWhere = { topics: { has: resolvedTopic } };

    const [questions, total, allTopicQuestions] = await Promise.all([
      prisma.question.findMany({
        where,
        take: Math.min(Number(limit), 200),
        skip: (Number(page) - 1) * Math.min(Number(limit), 200),
      }),
      prisma.question.count({ where }),
      prisma.question.findMany({
        where: statsWhere,
        select: { difficulty: true },
      }),
    ]);

    const stats = {
      total: allTopicQuestions.length,
      easy: allTopicQuestions.filter(q => q.difficulty === 'EASY').length,
      medium: allTopicQuestions.filter(q => q.difficulty === 'MEDIUM').length,
      hard: allTopicQuestions.filter(q => q.difficulty === 'HARD').length,
    };

    // ── Optional auth — enrich with user progress + bookmarks ────────────────
    // Mirrors the company route: if the user is logged in, batch-fetch their
    // progress and bookmarks for all returned questions in one query each,
    // then merge status + bookmarked onto each question object.
    // This is what was missing — without it, status is always undefined on refresh.
    const user = optionalAuth(req);
    let progressMap = {};
    let bookmarkSet = new Set();

    if (user) {
      const questionIds = questions.map(q => q.id);

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

      progressMap = Object.fromEntries(progressRecords.map(p => [p.questionId, p.status]));
      bookmarkSet = new Set(bookmarkRecords.map(b => b.questionId));
    }

    const problems = questions.map(q => ({
      ...q,
      status:     user ? (progressMap[q.id] || 'not-started') : null,
      bookmarked: user ? bookmarkSet.has(q.id) : null,
    }));

    res.json({
      success:       true,
      topic:         resolvedTopic,
      total,
      stats,
      authenticated: !!user,
      pagination: {
        page:       Number(page),
        limit:      Math.min(Number(limit), 200),
        total,
        totalPages: Math.ceil(total / Math.min(Number(limit), 200)),
      },
      problems,
    });
  } catch (e) { next(e); }
});

module.exports = router;

