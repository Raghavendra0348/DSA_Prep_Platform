const router = require('express').Router();
const prisma = require('../lib/prisma');

// ── GET /api/search ────────────────────────────────────────────────────────
// Unified search across questions (by title), topics, and companies. (M4: extended)
//
// Query params:
//   q          — search term (min 2 chars, required)
//   type       — "questions" | "topics" | "companies" | "all" (default: "all")
//   difficulty — EASY | MEDIUM | HARD (only applies to question search)
//   limit      — max 100, default 20
//
// Examples:
//   /api/search?q=two sum                     → all types
//   /api/search?q=dynamic&type=topics         → only topics
//   /api/search?q=google&type=companies       → only companies
//   /api/search?q=binary&type=questions&difficulty=MEDIUM
router.get('/', async (req, res, next) => {
  try {
    const { q, type = 'all', difficulty, limit = 20 } = req.query;

    if (!q || q.length < 2)
      return res.status(400).json({ success: false, error: 'Query must be at least 2 characters' });

    const VALID_TYPES = ['questions', 'topics', 'companies', 'all'];
    if (!VALID_TYPES.includes(type))
      return res.status(400).json({ success: false, error: `type must be one of: ${VALID_TYPES.join(' | ')}` });

    const takeLimit = Math.min(Number(limit), 100);

    // ── Build parallel queries based on type ───────────────────────────────
    const searchQuestions = (type === 'all' || type === 'questions');
    const searchTopics    = (type === 'all' || type === 'topics');
    const searchCompanies = (type === 'all' || type === 'companies');

    // Run only the needed queries — skip the rest
    const [questionResults, allQuestionsForTopics, companyResults] = await Promise.all([

      // ── Question search (by title) ─────────────────────────────────────
      searchQuestions
        ? prisma.question.findMany({
            where: {
              title: { contains: q, mode: 'insensitive' },
              ...(difficulty && { difficulty: difficulty.toUpperCase() }),
            },
            include: {
              companies: {
                include: { company: { select: { name: true, slug: true } } },
                where:   { period: 'all' },
                orderBy: { frequency: 'desc' },
                take:    5,  // top 5 companies per question
              },
            },
            take: takeLimit,
          })
        : Promise.resolve([]),

      // ── Topic search (topics are strings in the question array) ────────
      // PostgreSQL has no separate topics table — search across the topics[] field
      searchTopics
        ? prisma.question.findMany({ select: { topics: true } })
        : Promise.resolve([]),

      // ── Company search (by name) ──────────────────────────────────────
      searchCompanies
        ? prisma.company.findMany({
            where:   { name: { contains: q, mode: 'insensitive' } },
            include: {
              questions: {
                where:  { period: 'all' },
                select: { frequency: true, question: { select: { topics: true } } },
              },
            },
            take: takeLimit,
          })
        : Promise.resolve([]),
    ]);

    // ── Process topic results ─────────────────────────────────────────────
    // Extract unique topic names that match the query
    let topicResults = [];
    if (searchTopics && allQuestionsForTopics.length > 0) {
      const topicMap = {};
      allQuestionsForTopics.forEach(question =>
        question.topics.forEach(t => {
          if (t.toLowerCase().includes(q.toLowerCase())) {
            topicMap[t] = (topicMap[t] || 0) + 1;
          }
        })
      );
      topicResults = Object.entries(topicMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, takeLimit)
        .map(([name, problemCount]) => ({
          name,
          slug:         name.toLowerCase().replace(/\s+/g, '-'),
          problemCount,
        }));
    }

    // ── Shape final response ──────────────────────────────────────────────
    const response = { success: true, query: q, type };

    if (searchQuestions) {
      response.questions = {
        total:   questionResults.length,
        results: questionResults.map(q => ({
          id:           q.id,
          slug:         q.slug,
          title:        q.title,
          difficulty:   q.difficulty,
          topics:       q.topics,
          link:         q.link,
          companyCount: q.companies.length,
          companies:    q.companies.map(c => ({ name: c.company.name, slug: c.company.slug, frequency: c.frequency })),
        })),
      };
    }

    if (searchTopics) {
      response.topics = { total: topicResults.length, results: topicResults };
    }

    if (searchCompanies) {
      response.companies = {
        total:   companyResults.length,
        results: companyResults.map(c => ({
          name:          c.name,
          slug:          c.slug,
          questionCount: c.questions.length,
        })),
      };
    }

    res.json(response);
  } catch (e) { next(e); }
});

module.exports = router;
