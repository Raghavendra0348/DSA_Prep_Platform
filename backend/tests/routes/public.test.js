/**
 * Public Routes Integration Tests
 * Tests: GET /health | GET /api/stats | GET /api/companies | GET /api/search | GET /api/topics
 *
 * These are all public — no auth required.
 */

const request = require('supertest');
const app     = require('../../src/app');
const prisma  = require('../../src/lib/prisma');

afterAll(async () => {
  await prisma.$disconnect();
});

// ══════════════════════════════════════════════════════════════════════════════
describe('GET /health', () => {
  it('200 — returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/stats', () => {
  it('200 — returns platform stats', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stats.totalCompanies).toBeGreaterThan(0);
    expect(res.body.stats.totalQuestions).toBeGreaterThan(0);
    expect(res.body.stats.difficultyBreakdown).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/companies', () => {
  it('200 — returns company list', async () => {
    const res = await request(app).get('/api/companies');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.companies)).toBe(true);
    expect(res.body.total).toBeGreaterThan(0);
  });

  it('200 — /api/companies/slugs returns lightweight list', async () => {
    const res = await request(app).get('/api/companies/slugs');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const first = res.body.companies[0];
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('slug');
    // Should NOT have heavy fields
    expect(first.questionCount).toBeUndefined();
    expect(first.topTopics).toBeUndefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/search', () => {
  it('200 — returns results for "two sum" across all types', async () => {
    const res = await request(app).get('/api/search?q=two+sum');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.questions).toBeDefined();
    expect(res.body.questions.results.length).toBeGreaterThan(0);
  });

  it('200 — type=topics searches topic names', async () => {
    const res = await request(app).get('/api/search?q=dynamic&type=topics');
    expect(res.status).toBe(200);
    expect(res.body.topics).toBeDefined();
    expect(res.body.questions).toBeUndefined();
  });

  it('200 — type=companies searches company names', async () => {
    const res = await request(app).get('/api/search?q=google&type=companies');
    expect(res.status).toBe(200);
    expect(res.body.companies).toBeDefined();
    expect(res.body.companies.results.length).toBeGreaterThan(0);
  });

  it('400 — rejects query shorter than 2 chars', async () => {
    const res = await request(app).get('/api/search?q=a');
    expect(res.status).toBe(400);
  });

  it('400 — rejects invalid type', async () => {
    const res = await request(app).get('/api/search?q=test&type=invalid');
    expect(res.status).toBe(400);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/topics', () => {
  it('200 — returns topic list', async () => {
    const res = await request(app).get('/api/topics');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBeGreaterThan(0);
  });

  it('200 — returns problems for a valid topic slug', async () => {
    const res = await request(app).get('/api/topics/array');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.questions)).toBe(true);
  });

  it('404 — returns 404 for nonexistent topic', async () => {
    const res = await request(app).get('/api/topics/nonexistent-topic-xyz-abc');
    expect(res.status).toBe(404);
  });
});
