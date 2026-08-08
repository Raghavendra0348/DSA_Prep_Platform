const router = require('express').Router();
const prisma = require('../lib/prisma');

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

    const where = {
      topics: { has: resolvedTopic },          // exact DB value, correct casing
      ...(difficulty && { difficulty }),
    };

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        take: Math.min(Number(limit), 200),
        skip: (Number(page) - 1) * Math.min(Number(limit), 200),
      }),
      prisma.question.count({ where }),
    ]);

    res.json({ success: true, topic: resolvedTopic, total, questions });
  } catch (e) { next(e); }
});

module.exports = router;
