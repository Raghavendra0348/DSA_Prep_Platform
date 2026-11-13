const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const { databaseConfig } = require('./database-config');

const poolMax = Number(process.env.DB_POOL_MAX || 5);
if (!Number.isSafeInteger(poolMax) || poolMax < 1) {
  throw new Error('DB_POOL_MAX must be a positive integer');
}

const pool = new Pool({
  ...databaseConfig(process.env.DATABASE_URL),
  // Per-process limit: leave room for deploy overlap, migrations and the console.
  max: poolMax,
  idleTimeoutMillis: 30000,
  statement_timeout: 15000,
  query_timeout: 20000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});
// pg removes broken idle clients; subsequent requests can open fresh connections.
pool.on('error', (error) => {
  console.error('Database idle connection failed', { code: error.code || 'UNKNOWN' });
});
const adapter = new PrismaPg(pool, { disposeExternalPool: true });
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
