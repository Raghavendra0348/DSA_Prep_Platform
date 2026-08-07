const router       = require('express').Router();
const prisma       = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where:   { userId: req.user.id },
      include: { question: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, bookmarks });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { questionId } = req.body;
    const key = { userId: req.user.id, questionId: Number(questionId) };
    const exists = await prisma.bookmark.findUnique({ where: { userId_questionId: key } });

    if (exists) {
      await prisma.bookmark.delete({ where: { userId_questionId: key } });
      return res.json({ success: true, bookmarked: false });
    }
    await prisma.bookmark.create({ data: key });
    res.json({ success: true, bookmarked: true });
  } catch (e) { next(e); }
});

module.exports = router;
