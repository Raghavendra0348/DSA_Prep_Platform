const router = require('express').Router();
const prisma = require('../lib/prisma');

// ── Simple in-memory cache (stats change very rarely) ─────────────────────
let _statsCache    = null;
let _statsCacheAt  = 0;
const STATS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

router.get('/', async (req, res, next) => {
  try {
    // Serve from cache if fresh
    if (_statsCache && Date.now() - _statsCacheAt < STATS_CACHE_TTL) {
      return res.json(_statsCache);
    }

    const [companies, questions, users] = await Promise.all([
      prisma.company.count(),
      prisma.question.count(),
      prisma.user.count(),
    ]);

    const byDiff = await prisma.question.groupBy({
      by: ['difficulty'],
      _count: { id: true },
    });

    const allQuestions = await prisma.question.findMany({ select: { topics: true } });
    const topicMap = {};
    allQuestions.forEach(q => q.topics.forEach(t => topicMap[t]=(topicMap[t]||0)+1));

    _statsCache = {
      success: true,
      stats: {
        totalCompanies:   companies,
        totalQuestions:   questions,
        totalUsers:       users,
        totalTopics:      Object.keys(topicMap).length,
        lastUpdated:      new Date().toISOString(),
        difficultyBreakdown: Object.fromEntries(byDiff.map(d => [d.difficulty, d._count.id])),
      },
    };
    _statsCacheAt = Date.now();

    res.json(_statsCache);
  } catch (e) { next(e); }
});

module.exports = router;

