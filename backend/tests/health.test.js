const request = require('supertest');

jest.mock('../src/lib/prisma', () => ({ $queryRaw: jest.fn() }));
const prisma = require('../src/lib/prisma');
const app = require('../src/app');

afterEach(() => {
  jest.resetAllMocks();
  delete process.env.MAINTENANCE_MODE;
});

it('blocks existing browser API requests in maintenance while liveness stays up', async () => {
  process.env.MAINTENANCE_MODE = 'true';
  const response = await request(app).get('/api/companies');
  expect(response.status).toBe(503);
  expect(response.headers['retry-after']).toBe('300');
  expect((await request(app).post('/api/auth/register').send({})).status).toBe(503);
  expect((await request(app).get('/health/live')).status).toBe(200);
  expect(prisma.$queryRaw).not.toHaveBeenCalled();
});

it('reports a database outage without exposing internal errors, then recovers', async () => {
  prisma.$queryRaw.mockRejectedValueOnce(new Error('private connection details'));
  const down = await request(app).get('/health');
  expect(down.status).toBe(503);
  expect(down.body).toEqual({ status: 'unavailable', database: 'down' });
  expect(down.headers['cache-control']).toBe('no-store');

  prisma.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);
  const up = await request(app).get('/health');
  expect(up.status).toBe(200);
  expect(up.body).toEqual({ status: 'ok', database: 'up' });
});

it('keeps liveness available without querying an unavailable database', async () => {
  const response = await request(app).get('/health/live');
  expect(response.status).toBe(200);
  expect(prisma.$queryRaw).not.toHaveBeenCalled();
});

it('returns 503 within the health deadline even when a query hangs', async () => {
  prisma.$queryRaw.mockImplementationOnce(() => new Promise(() => {}));
  const response = await request(app).get('/health');
  expect(response.status).toBe(503);
}, 8000);
