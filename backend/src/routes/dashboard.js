const router       = require('express').Router();
const prisma       = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');

// ── GET /api/dashboard ─────────────────────────────────────────────────────
// Returns a comprehensive overview of the logged-in user's progress.
// All DB queries run in parallel for maximum performance.
//
// Response shape:
// {
//   overview:       { totalSolved, totalAttempted, totalBookmarks, totalQuestions }
//   difficulty:     { easy, medium, hard }  ← solved counts per difficulty
//   topCompanies:   [{ name, slug, solved, total }]  ← top 5 companies by solved count
//   topTopics:      [{ name, solved, total }]  ← top 5 topics by solved count
//   recentActivity: [{ title, slug, status, updatedAt }]  ← last 10 updates
// }
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // ── Fetch all user data in parallel ──────────────────────────
    // Running 3 separate queries simultaneously instead of sequentially.
    const [progressRecords, bookmarkCount, totalQuestions] = await Promise.all([
      // All progress records with full question details (for breakdown by difficulty/topic)
      prisma.progress.findMany({
        where:   { userId },
        include: {
          question: {
            select: { id: true, slug: true, title: true, difficulty: true, topics: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      // Total bookmarks count
      prisma.bookmark.count({ where: { userId } }),
      // Total questions in the platform
      prisma.question.count(),
    ]);

    // ── Compute Overview ─────────────────────────────────────────
    const solved    = progressRecords.filter(p => p.status === 'solved');
    const attempted = progressRecords.filter(p => p.status === 'attempted');

    const overview = {
      totalSolved:    solved.length,
      totalAttempted: attempted.length,
      totalBookmarks: bookmarkCount,
      totalQuestions,
    };

    // ── Difficulty Breakdown ─────────────────────────────────────
    // Count how many solved problems are Easy / Medium / Hard
    const difficulty = { easy: 0, medium: 0, hard: 0 };
    solved.forEach(p => {
      const diff = p.question.difficulty;
      if (diff === 'EASY')   difficulty.easy++;
      if (diff === 'MEDIUM') difficulty.medium++;
      if (diff === 'HARD')   difficulty.hard++;
    });

    // ── Topics Breakdown ─────────────────────────────────────────
    // For each solved question, count its topics → rank by frequency
    const topicSolvedMap = {};
    solved.forEach(p => {
      p.question.topics.forEach(t => {
        topicSolvedMap[t] = (topicSolvedMap[t] || 0) + 1;
      });
    });
    const topTopics = Object.entries(topicSolvedMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, solvedCount]) => ({ name, solvedCount }));

    // ── Top Companies by Solved Count ────────────────────────────
    // For each solved question, find which companies asked it
    // Then rank companies by how many of their questions are solved
    const solvedQuestionIds = new Set(solved.map(p => p.questionId));

    // Fetch company links for solved questions (one batch query)
    const companyLinks = await prisma.companyQuestion.findMany({
      where:   { questionId: { in: [...solvedQuestionIds] }, period: 'all' },
      include: { company: { select: { name: true, slug: true } } },
    });

    // Tally solved count per company
    const companySolvedMap = {};
    companyLinks.forEach(cl => {
      const key = cl.company.slug;
      if (!companySolvedMap[key]) {
        companySolvedMap[key] = { name: cl.company.name, slug: cl.company.slug, solvedCount: 0 };
      }
      companySolvedMap[key].solvedCount++;
    });

    const topCompanies = Object.values(companySolvedMap)
      .sort((a, b) => b.solvedCount - a.solvedCount)
      .slice(0, 5);

    // ── Recent Activity ──────────────────────────────────────────
    // Last 10 questions the user interacted with (any status)
    const recentActivity = progressRecords.slice(0, 10).map(p => ({
      questionId: p.questionId,
      slug:       p.question.slug,
      title:      p.question.title,
      difficulty: p.question.difficulty,
      status:     p.status,
      updatedAt:  p.updatedAt,
    }));

    res.json({
      success: true,
      overview,
      difficulty,
      topCompanies,
      topTopics,
      recentActivity,
    });
  } catch (e) { next(e); }
});

module.exports = router;
