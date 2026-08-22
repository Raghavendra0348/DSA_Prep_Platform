const router  = require('express').Router();
const prisma  = require('../lib/prisma');

// ── Simple in-memory cache ─────────────────────────────────────────────────
// Companies data changes very rarely (only when admin adds a company).
// Cache for 10 minutes so the expensive query runs once, not on every visit.
// On free-tier Render the server restarts periodically anyway, auto-clearing it.
let _cache    = null;
let _cacheAt  = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function isCacheValid() {
  return _cache !== null && Date.now() - _cacheAt < CACHE_TTL;
}

// ── GET /api/companies/featured?slugs=google,meta,amazon ──────────────────
// Lightweight endpoint — returns only the requested companies with counts
// and top topics. Designed for landing page; avoids the full /api/companies
// aggregation that processes all 471+ companies.
router.get('/featured', async (req, res, next) => {
  try {
    const slugParam = req.query.slugs || '';
    const slugs = slugParam.split(',').map(s => s.trim()).filter(Boolean);

    if (slugs.length === 0) {
      return res.json({ success: true, companies: [] });
    }

    // Fetch only the requested companies by slug
    const companies = await prisma.company.findMany({
      where: { slug: { in: slugs } },
      select: { id: true, name: true, slug: true },
    });

    if (companies.length === 0) {
      return res.json({ success: true, companies: [] });
    }

    const companyIds = companies.map(c => c.id);

    // Get question counts and top topics only for these companies
    const [countRows, topicRows] = await Promise.all([
      prisma.$queryRaw`
        SELECT   cq."companyId", COUNT(cq."questionId")::int AS "questionCount"
        FROM     "CompanyQuestion" cq
        WHERE    cq."companyId" = ANY(${companyIds}::int[]) AND cq.period = 'all'
        GROUP BY cq."companyId"
      `,
      prisma.$queryRaw`
        SELECT   cq."companyId",
                 unnest(q.topics) AS topic,
                 COUNT(*)::int    AS freq
        FROM     "CompanyQuestion" cq
        JOIN     "Question" q ON q.id = cq."questionId"
        WHERE    cq."companyId" = ANY(${companyIds}::int[]) AND cq.period = 'all'
        GROUP BY cq."companyId", topic
        ORDER BY cq."companyId", freq DESC
      `,
    ]);

    const countMap = {};
    for (const row of countRows) countMap[row.companyId] = row.questionCount;

    const topicsMap = {};
    for (const row of topicRows) {
      if (!topicsMap[row.companyId]) topicsMap[row.companyId] = [];
      if (topicsMap[row.companyId].length < 5) topicsMap[row.companyId].push(row.topic);
    }

    // Preserve the order from the request
    const slugOrder = new Map(slugs.map((s, i) => [s, i]));
    const result = companies
      .map(c => ({
        name:          c.name,
        slug:          c.slug,
        questionCount: countMap[c.id] ?? 0,
        topTopics:     topicsMap[c.id] ?? [],
      }))
      .sort((a, b) => (slugOrder.get(a.slug) ?? 99) - (slugOrder.get(b.slug) ?? 99));

    res.json({ success: true, companies: result });
  } catch (e) { next(e); }
});

// ── GET /api/companies/slugs ───────────────────────────────────────────────
// Lightweight endpoint — returns only name + slug for all companies.
// Used for navigation; skips questionCount + topTopics computation entirely.
router.get('/slugs', async (req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      select:  { name: true, slug: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, total: companies.length, companies });
  } catch (e) { next(e); }
});

// ── GET /api/companies ────────────────────────────────────────────────────
// Full company list with question count and top topics.
//
// PERF: Previously did a massive JOIN (all companies × all their questions ×
// all question topics) on EVERY request, then processed rows in JS.
// Now: cached result served instantly after first load.
// First load uses a raw SQL aggregation (DB does the heavy work, not Node).
router.get('/', async (req, res, next) => {
  try {
    // ── Serve from cache if still fresh ─────────────────────────────────
    if (isCacheValid()) {
      return res.json(_cache);
    }

    // ── First load (or cache expired): run the aggregation in the DB ─────
    // Query 1: question count per company (period='all' only)
    // Query 2: top 5 topics per company via unnest + GROUP BY
    const [countRows, topicRows] = await Promise.all([
      prisma.$queryRaw`
        SELECT   c.id, c.name, c.slug, COUNT(cq."questionId")::int AS "questionCount"
        FROM     "Company" c
        LEFT JOIN "CompanyQuestion" cq
               ON cq."companyId" = c.id AND cq.period = 'all'
        GROUP BY c.id, c.name, c.slug
        ORDER BY c.name ASC
      `,
      prisma.$queryRaw`
        SELECT   cq."companyId",
                 unnest(q.topics) AS topic,
                 COUNT(*)::int    AS freq
        FROM     "CompanyQuestion" cq
        JOIN     "Question" q ON q.id = cq."questionId"
        WHERE    cq.period = 'all'
        GROUP BY cq."companyId", topic
        ORDER BY cq."companyId", freq DESC
      `,
    ]);

    // ── Build top-topics lookup: companyId → string[] ──────────────────
    const topicsMap = {};
    for (const row of topicRows) {
      if (!topicsMap[row.companyId]) topicsMap[row.companyId] = [];
      if (topicsMap[row.companyId].length < 5) topicsMap[row.companyId].push(row.topic);
    }

    const companies = countRows.map(c => ({
      name:          c.name,
      slug:          c.slug,
      questionCount: c.questionCount,
      topTopics:     topicsMap[c.id] ?? [],
    }));

    // ── Store in cache ──────────────────────────────────────────────────
    _cache   = { success: true, total: companies.length, companies };
    _cacheAt = Date.now();

    res.json(_cache);
  } catch (e) { next(e); }
});

module.exports = router;
