const router = require('express').Router();
const prisma = require('../lib/prisma');

router.get('/', async (req, res, next) => {
  try {
    const { q, difficulty, limit = 20 } = req.query;
    if (!q || q.length < 2)
      return res.status(400).json({ error: 'Query must be at least 2 characters' });

    const questions = await prisma.question.findMany({
      where: {
        title: { contains: q, mode: 'insensitive' },
        ...(difficulty && { difficulty }),
      },
      include: {
        companies: {
          include: { company: { select: { name: true, slug: true } } },
          where:   { period: 'all' },
          orderBy: { frequency: 'desc' },
        },
      },
      take: Math.min(Number(limit), 100),
    });

    res.json({
      success: true, query: q, total: questions.length,
      results: questions.map(q => ({
        id: q.id, slug: q.slug, title: q.title,
        difficulty: q.difficulty, topics: q.topics, link: q.link,
        companyCount: q.companies.length,
        companies: q.companies.map(c => ({ name: c.company.name, slug: c.company.slug, frequency: c.frequency })),
      })),
    });
  } catch (e) { next(e); }
});

module.exports = router;
