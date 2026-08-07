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
    const topicName = topic.replace(/-/g,' ');

    const where = {
      topics: { has: topicName },
      ...(difficulty && { difficulty }),
    };

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        take: Math.min(Number(limit),200),
        skip: (Number(page)-1)*Math.min(Number(limit),200),
      }),
      prisma.question.count({ where }),
    ]);

    res.json({ success: true, topic: topicName, total, questions });
  } catch (e) { next(e); }
});

module.exports = router;
