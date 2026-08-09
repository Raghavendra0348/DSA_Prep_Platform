/**
 * Auth Routes Integration Tests
 * Tests: POST /api/auth/register | POST /api/auth/login | POST /api/auth/refresh | POST /api/auth/logout
 *
 * Run: npm test
 * Note: Uses a real DB connection — ensure DATABASE_URL is set in .env
 */

const request = require('supertest');
const app     = require('../../src/app');
const prisma  = require('../../src/lib/prisma');

// ── Test user shared across tests ──────────────────────────────────────────
const TEST_USER = {
  email:    'jest_test_user@example.com',
  name:     'Jest Test',
  password: 'testpass123',
};

let authToken;
let refreshToken;

// ── Cleanup before & after ─────────────────────────────────────────────────
beforeAll(async () => {
  // Remove test user if left over from a previous run
  await prisma.user.deleteMany({ where: { email: TEST_USER.email } });
});

afterAll(async () => {
  // Clean up test user and close DB connection
  await prisma.user.deleteMany({ where: { email: TEST_USER.email } });
  await prisma.$disconnect();
});

// ══════════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/register', () => {

  it('201 — registers a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(TEST_USER);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.email).toBe(TEST_USER.email);
    expect(res.body.user.password).toBeUndefined(); // password must NOT be in response

    // Save tokens for subsequent tests
    authToken    = res.body.token;
    refreshToken = res.body.refreshToken;
  });

  it('409 — rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(TEST_USER);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('400 — rejects invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'notanemail', name: 'Test', password: 'pass123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.issues).toBeDefined();
  });

  it('400 — rejects short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'other@test.com', name: 'Test', password: '123' });

    expect(res.status).toBe(400);
  });

  it('400 — rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com' });

    expect(res.status).toBe(400);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/login', () => {

  it('200 — logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('401 — rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('401 — rejects non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'somepass' });

    expect(res.status).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/refresh', () => {

  it('200 — issues new access token with valid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('400 — rejects missing refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});

    expect(res.status).toBe(400);
  });

  it('401 — rejects fake/invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'fake.token.here' });

    expect(res.status).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/me', () => {

  it('200 — returns user profile with valid token', async () => {
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(TEST_USER.email);
    expect(res.body.user.password).toBeUndefined();
  });

  it('401 — rejects request without token', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
  });

  it('401 — rejects request with invalid token', async () => {
    const res = await request(app)
      .get('/api/me')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.status).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe('POST /api/auth/logout', () => {

  it('200 — logs out and revokes refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('401 — refresh token no longer works after logout', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken }); // was just revoked

    expect(res.status).toBe(401);
  });
});
