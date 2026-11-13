// Inspection/verification are read-only; explicit dump/restore and sync-env
// commands perform the reviewed migration operations.
require('dotenv').config({ path: require('node:path').join(__dirname, '../.env'), quiet: true });
const { Client } = require('pg');
const { databaseConfig } = require('../src/lib/database-config');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { spawnSync } = require('node:child_process');
const quote = value => '"' + value.replace(/"/g, '""') + '"';

function directUrl(value) {
  // Source-specific trust must be in that URL; don't apply Aiven's private CA
  // to Neon while inspecting both databases in the same process.
  const config = databaseConfig(value, { ...process.env, DB_SSL_CA_PATH: undefined });
  if (new URL(config.connectionString).hostname.includes('-pooler.')) {
    throw new Error('Migration inspection requires a direct, non-pooled URL');
  }
  return config;
}

function stageEnvironment(neonText, backendText) {
  const dotenv = require('dotenv');
  const neon = dotenv.parse(neonText);
  const current = dotenv.parse(backendText);
  const pooled = new URL(databaseConfig(neon.DATABASE_URL, {}).connectionString);
  const direct = new URL(directUrl(neon.DATABASE_URL_UNPOOLED || neon.DIRECT_URL).connectionString);
  if (!(pooled.hostname.endsWith('.neon.tech') && pooled.hostname.includes('-pooler.'))) {
    throw new Error('Neon runtime URL must use a pooled endpoint');
  }
  if (pooled.hostname.replace('-pooler.', '.') !== direct.hostname ||
      pooled.pathname !== direct.pathname || pooled.username !== direct.username) {
    throw new Error('Neon URLs must target the same branch, database and role');
  }
  const updates = { NEON_DATABASE_URL: pooled.toString(), NEON_DIRECT_URL: direct.toString() };
  // Preserve the original source even after a later cutover changes DATABASE_URL.
  if (!current.SOURCE_DATABASE_URL && current.DATABASE_URL &&
      !new URL(current.DATABASE_URL).hostname.endsWith('.neon.tech')) {
    updates.SOURCE_DATABASE_URL = current.DATABASE_URL;
  }
  let text = backendText;
  for (const [key, value] of Object.entries(updates)) {
    const line = `${key}=${JSON.stringify(value)}`;
    const pattern = new RegExp(`^${key}=.*$`, 'm');
    text = pattern.test(text) ? text.replace(pattern, () => line) : text.trimEnd() + '\n' + line + '\n';
  }
  return text;
}

async function inspect(value) {
  const client = new Client({ ...directUrl(value), statement_timeout: 60000, query_timeout: 65000 });
  client.on('error', () => {}); // In-flight queries still reject; never print secrets.
  try {
    await client.connect();
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    await client.query("SET LOCAL TIME ZONE 'UTC'");
    const { rows: [server] } = await client.query(`
      SELECT current_setting('server_version') AS version,
             pg_database_size(current_database())::text AS database_bytes`);
    const { rows: extensions } = await client.query('SELECT extname, extversion FROM pg_extension ORDER BY extname');
    const { rows: columns } = await client.query(`
      SELECT table_name, column_name, ordinal_position, data_type, udt_name,
             is_nullable, column_default
      FROM information_schema.columns WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position`);
    const { rows: constraints } = await client.query(`
      SELECT c.relname AS table_name, con.conname AS name,
             pg_get_constraintdef(con.oid) AS definition
      FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' ORDER BY c.relname, con.conname`);
    const { rows: indexes } = await client.query(`
      SELECT tablename, indexname, indexdef FROM pg_indexes
      WHERE schemaname = 'public' ORDER BY tablename, indexname`);
    const { rows: tables } = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`);
    const data = [];
    for (const { tablename } of tables) {
      const { rows: [summary] } = await client.query(`
        SELECT count(*)::text AS rows,
          md5(coalesce(string_agg(row_hash, '' ORDER BY row_hash), '')) AS fingerprint
        FROM (SELECT md5(row_to_json(t)::text) AS row_hash
              FROM public.${quote(tablename)} t) hashes`);
      data.push({ table: tablename, ...summary });
    }
    const { rows: sequences } = await client.query(`
      SELECT sequencename, start_value::text, min_value::text, max_value::text,
             increment_by::text, cycle, cache_size::text
      FROM pg_sequences WHERE schemaname = 'public' ORDER BY sequencename`);
    for (const sequence of sequences) {
      const { rows: [state] } = await client.query(
        `SELECT last_value::text, is_called FROM public.${quote(sequence.sequencename)}`);
      Object.assign(sequence, state);
    }
    const migrationFiles = require('node:fs').readdirSync(require('node:path').join(__dirname, '../prisma/migrations'))
      .filter(name => name !== 'migration_lock.toml').sort();
    let migrations = [];
    if (tables.some(t => t.tablename === '_prisma_migrations')) {
      ({ rows: migrations } = await client.query(`
        SELECT migration_name, checksum, finished_at IS NOT NULL AS finished,
               rolled_back_at IS NOT NULL AS rolled_back
        FROM public._prisma_migrations ORDER BY migration_name, checksum`));
    }
    await client.query('COMMIT');
    return { server, extensions, columns, constraints, indexes, data, sequences, migrations, migrationFiles };
  } finally {
    await client.end();
  }
}

function differences(source, target) {
  return ['columns', 'constraints', 'indexes', 'data', 'sequences', 'migrations']
    .filter(key => JSON.stringify(source[key]) !== JSON.stringify(target[key]));
}

function restoreList(list) {
  // Neon already has public. Retain all its contents, but don't recreate it.
  return list.split(/\r?\n/).filter(line => !/^\d+; \d+ \d+ SCHEMA - public(?:\s|$)/.test(line)).join('\n');
}

function backupPath(filename, mustExist) {
  if (!filename || !path.isAbsolute(filename)) throw new Error('Use an absolute backup path outside the repository');
  const directory = fs.realpathSync(path.dirname(filename));
  const repository = fs.realpathSync(path.join(__dirname, '../..'));
  const relative = path.relative(repository, directory);
  if (relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative))) {
    throw new Error('Backups must be outside the repository');
  }
  const result = path.join(directory, path.basename(filename));
  if (mustExist) {
    if (fs.lstatSync(result).isSymbolicLink() || !fs.statSync(result).isFile()) throw new Error('Backup must be a regular file');
  } else {
    // Reserve exclusively, so a previous backup is never overwritten.
    fs.closeSync(fs.openSync(result, 'wx', 0o600));
  }
  return result;
}

function pgEnvironment(value) {
  const url = new URL(directUrl(value).connectionString);
  // Do not inherit unrelated libpq settings or expose passwords in argv/logs.
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^PG/i.test(key)));
  Object.assign(env, {
    PGHOST: url.hostname, PGPORT: url.port || '5432',
    PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
    PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password),
    PGSSLMODE: url.searchParams.get('sslmode'), PGCONNECT_TIMEOUT: '10',
  });
  if (url.searchParams.has('sslrootcert')) env.PGSSLROOTCERT = url.searchParams.get('sslrootcert');
  else if (env.PGSSLMODE === 'verify-full') env.PGSSLROOTCERT = 'system';
  for (const [parameter, variable] of [['sslcert', 'PGSSLCERT'], ['sslkey', 'PGSSLKEY'], ['channel_binding', 'PGCHANNELBINDING']]) {
    if (url.searchParams.has(parameter)) env[variable] = url.searchParams.get(parameter);
  }
  return env;
}

async function pgTool(tool, args, value) {
  const env = pgEnvironment(value);
  let caDirectory;
  // Windows libpq/OpenSSL may lack a usable default public-CA directory even
  // though Node verifies Neon successfully. Supply Node's trusted roots instead.
  if (process.platform === 'win32' && env.PGSSLROOTCERT === 'system') {
    caDirectory = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'dsa-neon-ca-'));
    const tls = require('node:tls');
    env.PGSSLROOTCERT = path.join(caDirectory, 'ca.pem');
    fs.writeFileSync(env.PGSSLROOTCERT,
      (tls.getCACertificates ? tls.getCACertificates('default') : tls.rootCertificates).join('\n'), { mode: 0o600 });
  }
  try {
    await new Promise((resolve, reject) => {
      const child = spawn(tool, args, { env, shell: false, stdio: 'ignore' });
      child.on('error', reject);
      child.on('exit', code => code === 0 ? resolve() : reject(Object.assign(new Error(), { code: `${tool}_EXIT_${code}` })));
    });
  } finally {
    if (caDirectory) {
      fs.unlinkSync(env.PGSSLROOTCERT);
      fs.rmdirSync(caDirectory);
    }
  }
}

async function main() {
  const command = process.argv[2];
  if (!['preflight', 'verify', 'dump', 'restore', 'sync-env'].includes(command)) {
    throw new Error('Usage: node scripts/neon-migration.js preflight|verify|dump|restore|sync-env [absolute-backup-path]');
  }
  if (command === 'sync-env') {
    const envFile = path.join(__dirname, '../.env');
    const updated = stageEnvironment(fs.readFileSync(path.join(__dirname, '../../.env.local'), 'utf8'),
      fs.readFileSync(envFile, 'utf8'));
    fs.writeFileSync(envFile, updated, { mode: 0o600 });
    console.log('Neon migration URLs staged in backend/.env; the active database and other settings were preserved.');
    return;
  }
  const sourceUrl = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;
  if (command === 'dump') {
    await pgTool('pg_dump', ['--format=custom', '--schema=public', '--no-owner', '--no-acl',
      '--file', backupPath(process.argv[3], false)], sourceUrl);
    console.log('Backup completed. This archive contains private data; keep it outside Git.');
    return;
  }
  if (command === 'restore') {
    if (process.env.MIGRATION_WRITES_STOPPED !== 'true' || process.env.MIGRATION_TARGET_REVIEWED !== 'true') {
      throw new Error('Restore requires MIGRATION_WRITES_STOPPED=true and MIGRATION_TARGET_REVIEWED=true');
    }
    const destination = new URL(directUrl(process.env.NEON_DIRECT_URL).connectionString);
    if (!destination.hostname.endsWith('.neon.tech')) throw new Error('Restore destination must be Neon');
    const target = await inspect(process.env.NEON_DIRECT_URL);
    if (target.columns.length || target.sequences.length || target.data.length) throw new Error('Restore destination must be empty');
    const archive = backupPath(process.argv[3], true);
    const entries = spawnSync('pg_restore', ['--list', archive], { encoding: 'utf8', windowsHide: true });
    if (entries.error || entries.status !== 0) throw new Error('Unable to read backup table of contents');
    const listDirectory = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'dsa-restore-list-'));
    const listFile = path.join(listDirectory, 'restore.list');
    fs.writeFileSync(listFile, restoreList(entries.stdout), { mode: 0o600 });
    try {
      await pgTool('pg_restore', ['--no-owner', '--no-acl', '--exit-on-error', '--single-transaction',
        '--use-list', listFile, '--dbname', decodeURIComponent(destination.pathname.slice(1)), archive], process.env.NEON_DIRECT_URL);
    } finally {
      fs.unlinkSync(listFile);
      fs.rmdirSync(listDirectory);
    }
    console.log('Restore completed. Run verify before enabling application traffic.');
    return;
  }
  const source = await inspect(sourceUrl);
  if (command === 'preflight') {
    console.log(JSON.stringify(source, null, 2));
    return;
  }
  const target = await inspect(process.env.NEON_DIRECT_URL);
  const mismatch = differences(source, target);
  const requiredExtensions = source.extensions.map(e => e.extname);
  if (requiredExtensions.some(name => !target.extensions.some(e => e.extname === name))) mismatch.push('extensions');
  console.log(JSON.stringify({ matched: mismatch.length === 0, differences: mismatch,
    sourceTables: source.data, targetTables: target.data }, null, 2));
  if (mismatch.length) process.exitCode = 1;
}

if (require.main === module) main().catch(error => {
  // Driver errors can contain URLs, usernames, or row contents. Report codes only.
  console.error('Migration inspection failed:', error.code || 'CONFIG_OR_CONNECTION_ERROR');
  process.exitCode = 1;
});
module.exports = { inspect, differences, directUrl, pgEnvironment, backupPath, stageEnvironment, restoreList };
