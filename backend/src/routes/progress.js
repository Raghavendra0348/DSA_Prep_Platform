const router       = require('express').Router();
const prisma       = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const progress = await prisma.progress.findMany({
      where:   { userId: req.user.id },
      include: { question: { select: { slug: true, title: true } } },
    });
    res.json({ success: true, progress });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { questionId, status } = req.body;
    const validStatuses = ['solved','attempted','not-started'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ error: 'Invalid status' });

    const progress = await prisma.progress.upsert({
      where:  { userId_questionId: { userId: req.user.id, questionId: Number(questionId) } },
      update: { status },
      create: { userId: req.user.id, questionId: Number(questionId), status },
    });
    res.json({ success: true, progress });
  } catch (e) { next(e); }
});

module.exports = router;
