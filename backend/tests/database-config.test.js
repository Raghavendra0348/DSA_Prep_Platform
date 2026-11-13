const { Client } = require('pg');
const { databaseConfig } = require('../src/lib/database-config');
const { directUrl, differences, pgEnvironment, backupPath, stageEnvironment, restoreList } = require('../scripts/neon-migration');

it.each(['require', 'no-verify', 'disable'])('verifies remote TLS even with sslmode=%s', mode => {
  const config = databaseConfig(`postgresql://test:secret@ep-test.neon.tech/db?sslmode=${mode}&uselibpqcompat=true&ssl=false`, {});
  const client = new Client(config);
  expect(new URL(config.connectionString).searchParams.get('sslmode')).toBe('verify-full');
  expect(client.connectionParameters.ssl).not.toBe(false);
  expect(client.connectionParameters.ssl.rejectUnauthorized).not.toBe(false);
  expect(config.enableChannelBinding).toBe(true);
});

it('allows local plaintext development and preserves URL-encoded credentials', () => {
  const config = databaseConfig('postgresql://user:p%40ss@localhost/db', {});
  const client = new Client(config);
  expect(client.connectionParameters.ssl).toBe(false);
  expect(client.connectionParameters.password).toBe('p@ss');
});

it('requires TLS locally in production', () => {
  expect(new URL(databaseConfig('postgresql://u:p@localhost/db', { NODE_ENV: 'production' }).connectionString)
    .searchParams.get('sslmode')).toBe('verify-full');
});

it('rejects missing or malformed credentials without including secrets', () => {
  expect(() => databaseConfig(undefined)).toThrow('A valid PostgreSQL connection URL is required');
  expect(() => databaseConfig('https://user:secret@host')).toThrow('A valid PostgreSQL connection URL is required');
});

it('rejects the Neon pooler for administration', () => {
  expect(() => directUrl('postgresql://u:p@ep-test-pooler.neon.tech/db')).toThrow('direct');
});

it('detects copied row, schema, migration, and sequence discrepancies', () => {
  const source = { columns: [], constraints: [], indexes: [], data: [{ rows: '5' }], sequences: [{ last_value: '8' }], migrations: [] };
  expect(differences(source, structuredClone(source))).toEqual([]);
  expect(differences(source, { ...source, data: [], sequences: [], columns: ['changed'], migrations: ['changed'] }))
    .toEqual(['columns', 'data', 'sequences', 'migrations']);
});

it('passes credentials through libpq environment and keeps verification enabled', () => {
  const previous = process.env.PGSSLMODE;
  const previousHost = process.env.PGHOSTADDR;
  process.env.PGSSLMODE = 'disable';
  process.env.PGHOSTADDR = 'untrusted-host';
  try {
    const env = pgEnvironment('postgresql://user:p%40ss@ep-test.neon.tech/db?sslmode=require&channel_binding=require');
    expect(env.PGPASSWORD).toBe('p@ss');
    expect(env.PGSSLMODE).toBe('verify-full');
    expect(env.PGSSLROOTCERT).toBe('system');
    expect(env.PGCHANNELBINDING).toBe('require');
    expect(env.PGHOSTADDR).toBeUndefined();
  } finally {
    if (previous === undefined) delete process.env.PGSSLMODE;
    else process.env.PGSSLMODE = previous;
    if (previousHost === undefined) delete process.env.PGHOSTADDR;
    else process.env.PGHOSTADDR = previousHost;
  }
});

it('rejects a backup destination inside the repository before creating a file', () => {
  const path = require('node:path');
  expect(() => backupPath(path.join(__dirname, '../unsafe.dump'), false)).toThrow('outside the repository');
});

it('stages Neon credentials while preserving the active Aiven database and authentication secrets', () => {
  const dotenv = require('dotenv');
  const old = 'DATABASE_URL="postgresql://old:old@source.aivencloud.com/db"\nJWT_SECRET=unchanged\n';
  const neon = 'DATABASE_URL="postgresql://role:p%40ss@ep-test-pooler.region.aws.neon.tech/db"\n' +
    'DATABASE_URL_UNPOOLED="postgresql://role:p%40ss@ep-test.region.aws.neon.tech/db"\n';
  const updated = dotenv.parse(stageEnvironment(neon, old));
  expect(updated.DATABASE_URL).toBe(dotenv.parse(old).DATABASE_URL);
  expect(updated.SOURCE_DATABASE_URL).toBe(updated.DATABASE_URL);
  expect(updated.JWT_SECRET).toBe('unchanged');
  expect(new URL(updated.NEON_DATABASE_URL).hostname).toContain('-pooler.');
  expect(new URL(updated.NEON_DIRECT_URL).hostname).not.toContain('-pooler.');
});

it('refuses to stage URLs from different branches', () => {
  expect(() => stageEnvironment('DATABASE_URL=postgresql://u:p@ep-a-pooler.region.neon.tech/db\n' +
    'DATABASE_URL_UNPOOLED=postgresql://u:p@ep-b.region.neon.tech/db', 'DATABASE_URL=postgresql://u:p@localhost/db'))
    .toThrow('same branch');
});

it('skips recreating public without excluding tables or schema metadata', () => {
  const list = '5; 2615 2200 SCHEMA - public owner\n10; 1259 100 TABLE public User owner\n11; 0 0 COMMENT - SCHEMA public owner';
  expect(restoreList(list)).toBe('10; 1259 100 TABLE public User owner\n11; 0 0 COMMENT - SCHEMA public owner');
});
