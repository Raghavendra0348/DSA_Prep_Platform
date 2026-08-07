const router = require('express').Router();
const prisma = require('../lib/prisma');

router.get('/', async (req, res, next) => {
  try {
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

    res.json({
      success: true,
      stats: {
        totalCompanies:   companies,
        totalQuestions:   questions,
        totalUsers:       users,
        totalTopics:      Object.keys(topicMap).length,
        lastUpdated:      '2025-06-01',
        difficultyBreakdown: Object.fromEntries(byDiff.map(d => [d.difficulty, d._count.id])),
      },
    });
  } catch (e) { next(e); }
});

module.exports = router;
