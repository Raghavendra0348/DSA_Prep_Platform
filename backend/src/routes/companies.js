const router  = require('express').Router();
const prisma  = require('../lib/prisma');

router.get('/', async (req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        questions: {
          where:   { period: 'all' },
          select:  { frequency: true, question: { select: { topics: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    const result = companies.map(c => ({
      name:          c.name,
      slug:          c.slug,
      questionCount: c.questions.length,
      topTopics:     getTopTopics(c.questions),
    }));

    res.json({ success: true, total: result.length, companies: result });
  } catch (e) { next(e); }
});

function getTopTopics(questions) {
  const freq = {};
  questions.forEach(q => q.question.topics.forEach(t => freq[t] = (freq[t] || 0) + 1));
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);
}

module.exports = router;
