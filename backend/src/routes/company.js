const router = require('express').Router();
const prisma = require('../lib/prisma');

const VALID_PERIODS = ['30days','3months','6months','6plus','all'];
const VALID_SORT    = ['frequency','acceptanceRate','difficulty'];

router.get('/:slug', async (req, res, next) => {
  try {
    const { slug }                                           = req.params;
    const { period = 'all', difficulty, topics, sortBy = 'frequency', page = 1, limit = 50 } = req.query;

    if (!VALID_PERIODS.includes(period))
      return res.status(400).json({ error: 'Invalid period', code: 'INVALID_PERIOD' });

    const company = await prisma.company.findUnique({ where: { slug } });
    if (!company)
      return res.status(404).json({ error: 'Company not found', code: 'COMPANY_NOT_FOUND' });

    const where = {
      companyId: company.id,
      period,
      ...(difficulty && { question: { difficulty: { in: difficulty.split(',') } } }),
    };

    const [rows, total] = await Promise.all([
      prisma.companyQuestion.findMany({
        where,
        include: { question: true },
        orderBy: VALID_SORT.includes(sortBy) ? { [sortBy]: 'desc' } : { frequency: 'desc' },
        take:    Math.min(Number(limit), 200),
        skip:    (Number(page) - 1) * Math.min(Number(limit), 200),
      }),
      prisma.companyQuestion.count({ where }),
    ]);

    res.json({
      success: true, company: company.name, period,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
      problems: rows.map(r => ({ ...r.question, frequency: r.frequency, acceptanceRate: r.acceptanceRate })),
    });
  } catch (e) { next(e); }
});

router.get('/:slug/stats', async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({ where: { slug: req.params.slug } });
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const stats = {};
    for (const period of ['30days','3months','6months','6plus','all']) {
      const rows = await prisma.companyQuestion.findMany({
        where: { companyId: company.id, period },
        include: { question: { select: { difficulty: true, topics: true } } },
      });
      if (!rows.length) continue;
      const topicMap = {};
      rows.forEach(r => r.question.topics.forEach(t => topicMap[t] = (topicMap[t]||0)+1));
      stats[period] = {
        total:     rows.length,
        easy:      rows.filter(r => r.question.difficulty === 'EASY').length,
        medium:    rows.filter(r => r.question.difficulty === 'MEDIUM').length,
        hard:      rows.filter(r => r.question.difficulty === 'HARD').length,
        topTopics: Object.entries(topicMap).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([t])=>t),
      };
    }
    res.json({ success: true, company: company.name, stats });
  } catch (e) { next(e); }
});

module.exports = router;
