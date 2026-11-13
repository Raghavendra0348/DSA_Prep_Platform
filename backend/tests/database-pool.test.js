const { EventEmitter } = require('events');

jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('pg', () => ({ Pool: jest.fn() }));
jest.mock('@prisma/adapter-pg', () => ({ PrismaPg: jest.fn() }));
jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn() }));

it('handles a broken idle connection without an unhandled error event', () => {
  const previousUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';
  const pool = new EventEmitter();
  require('pg').Pool.mockImplementation(() => pool);
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    require('../src/lib/prisma');
    expect(() => pool.emit('error', Object.assign(new Error('private details'), {
      code: 'ECONNRESET',
    }))).not.toThrow();
    expect(log).toHaveBeenCalledWith('Database idle connection failed', { code: 'ECONNRESET' });
  } finally {
    log.mockRestore();
    if (previousUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousUrl;
  }
});
