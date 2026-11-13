# Aiven to Neon migration

Status (13 November 2026): the rehearsal and final production restore completed.
Every public table's row count/fingerprint, schema checks, sequences, and migration
history matched the paused Aiven source. The local backend now targets Neon.
The owner updated/resumed Render. Public health, statistics, search, and company
browsing return 200 with the expected 429 companies, 3,392 questions and 9 users.
A connection audit found two other client connections on Neon and none on Aiven,
consistent with the resumed backend using Neon. Render still serves the older
backend code (`/health/live` returns 404); deploy the local changes to enable the
new pool/health safeguards. Natural idle-wake observation remains pending.
Aiven remains available for rollback, and the final backup is stored outside this repository
in `C:/Users/arell/Desktop/Batman/DSA_Database_Backups`.

## Neon CLI integration

The repository is linked to the selected production branch through ignored
`.neon` metadata. `neon.ts` declares the requested Auth, private `assets` bucket,
starter `hello` Function, and Realtime services. The existing Express API and JWT
login remain the application's backend and authentication system; provisioning
Neon Auth does not migrate existing user identities or change login behavior.

`neon deploy` refreshes the ignored root `.env.local`. Do not copy this file into
the Vite frontend: it contains database, storage, and Realtime secrets. The CLI
names its direct PostgreSQL URL `DATABASE_URL_UNPOOLED`; Prisma and CSV imports
accept it as a fallback after `DIRECT_URL`.

After a deployment or credential rotation, stage the Neon database URLs safely:

```powershell
npm run db:neon -- sync-env
```

This copies only the pooled/direct database URLs into `NEON_DATABASE_URL` and
`NEON_DIRECT_URL` in `backend/.env`, and preserves the original Aiven URL as
`SOURCE_DATABASE_URL`. It never activates Neon, overwrites JWT secrets, or changes
the active `DATABASE_URL`. Complete the validated cutover below before switching
the active runtime and migration URLs. The Neon Codex plugin includes skills and
MCP; restart the agent to load its tools after installation.

## Configure and preflight

Run commands below from `backend`. Scripts load `backend/.env` without printing
credentials. Never commit secrets or database archives. Keep backups in an
access-restricted directory outside this repository.

- Create Neon Free near the Render backend, using the source PostgreSQL major
  version where available. Check actual size against current plan allowances.
- Keep `DATABASE_URL` pointing to Aiven until cutover. Save its direct connection
  separately as `SOURCE_DATABASE_URL` so comparisons still work after cutover.
- Download Aiven's CA from its console. Add an URL-encoded `sslrootcert` path to
  **SOURCE_DATABASE_URL**. Do not disable verification. `DB_SSL_CA_PATH` is also
  supported for the running Aiven app, but must be removed when switching to Neon
  so its private CA does not replace Neon's public CA trust.
  Migration tooling reads source trust from `SOURCE_DATABASE_URL` specifically;
  it does not apply `DB_SSL_CA_PATH` globally to both migration endpoints.
- Set `NEON_DATABASE_URL` to Neon's pooled URL and `NEON_DIRECT_URL` to its direct
  URL. Keep TLS and channel-binding parameters. Use `sslmode=verify-full`.
- Install PostgreSQL tools matching the selected target major version, which must
  be at least the source major version; verify `pg_dump --version` and
  `pg_restore --version`. Do not attempt a major-version downgrade.

```powershell
npm run db:neon -- preflight
npx prisma migrate status
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
```

Preflight runs a read-only snapshot and prints version, physical database size,
extensions, table counts and fingerprints, columns, constraints, indexes, sequence
states, and migration records. Reports exclude user rows and credentials, but
should still be treated as internal. The size includes PostgreSQL overhead; also
check Neon's actual storage usage after the rehearsal restore.

**Resolved migration-file gap:** `VerificationCode` already exists on Aiven and
matches the Prisma schema, but was absent from historical migration SQL. The new
`20261113000000_add_verification_code` migration captures its verified definition.
It was marked applied on the isolated rehearsal branch, then on the verified,
paused source. That source ledger update is included in the final production dump.
Never execute its CREATE TABLE against an existing verified table, reset the
schema, or alter historical checksums. Historical checksums can match either LF
or CRLF versions of the same checked-out file; preserve those files as they are.

Review extensions and any public views, functions, triggers, policies, or extra
objects against Neon's supported features. The archive deliberately includes only
`public` so provider-managed schemas and roles are excluded. If application objects
exist elsewhere, stop and expand the reviewed scope before exporting. Required
extensions need to be installed on Neon before restore; a public-only dump does
not automatically provision extensions from other schemas. Compare schema-only
exports manually for objects beyond those checked by `verify`.

## Rehearse the transfer

Point `NEON_DIRECT_URL` at an empty rehearsal branch/database. On Windows:

```powershell
npm run db:neon -- dump C:/secure-backups/dsa-rehearsal.dump
$env:MIGRATION_WRITES_STOPPED = 'true'
$env:MIGRATION_TARGET_REVIEWED = 'true'
npm run db:neon -- restore C:/secure-backups/dsa-rehearsal.dump
npm run db:neon -- verify
```

The rehearsal flags attest that no writer targets the rehearsal destination and
that extension/object compatibility has been reviewed. Aiven can remain live
during rehearsal: concurrent source writes can legitimately make `verify` differ.
Final verification requires a frozen source. Test the rehearsal with an isolated
backend and test accounts; do not let it send real emails or serve public traffic.

The dump is custom format with schema, rows, sequence values and
`_prisma_migrations`. Restore uses direct connections, `--no-owner`, `--no-acl`,
`--exit-on-error`, and one transaction. It rejects an existing destination schema
with tables/columns/sequences, pooled endpoints, and non-Neon hosts. Archives must
use a new absolute path outside Git; existing archives are never overwritten.
An interrupted dump can leave an incomplete file: use a new filename on retry.
Database passwords are passed in child-process environment, not command arguments.
If a PostgreSQL tool fails, inspect it locally with protected diagnostics; the
wrapper suppresses raw tool output to avoid leaking private data. Existing
`public` schema creation is excluded from the archive's restore list; all table
definitions, data, and schema metadata remain included. On Windows, public-CA
connections use a temporary copy of Node's trusted CA bundle for libpq, removed
after the command. Private Aiven trust still uses the explicit source CA file.

## Final maintenance and switch

1. Set `VITE_MAINTENANCE_MODE=true` in Vercel and redeploy. Set
   `MAINTENANCE_MODE=true` in Render and redeploy to block `/api` even for old tabs.
   If deploying the new verified-TLS code while still on Aiven, configure its CA
   file first. Wait for in-flight requests to drain, then stop all backend
   instances, workers, imports, consoles, and other writers. The flags alone do
   not stop independent database clients.
2. Point `NEON_DIRECT_URL` at the empty **production** Neon database, not the
   rehearsal target. Take a fresh final dump with a unique filename. Set the two
   restore attestation flags only after writes are stopped and the target is
   reviewed. Restore using the rehearsal commands.
3. Run `npm run db:neon -- verify`. Require `matched: true` and exit code 0.
   This checks row counts and deterministic row fingerprints for every public
   table, migration rows, column definitions, constraints, indexes, and sequence
   values/settings. Extension presence is checked; version compatibility requires
   review. Sequences are not MVCC snapshots: do not allow writers during final
   verification. Confirm constraints are valid and sequences exceed existing IDs
   before reopening traffic. Preserve the source sequence state rather than
   arbitrarily resetting it.
4. Set Render `DATABASE_URL` to the pooled Neon URL and `DIRECT_URL` to the direct
   Neon URL. Remove Aiven-only CA settings. Keep all JWT, Google, email, and CORS
   settings unchanged. For local CLI work, set `DIRECT_URL` to Neon too.
5. Run Prisma migration status against Neon. Apply only genuinely pending,
   reviewed migrations after resolving known drift. Do **not** run CSV import,
   schema reset, or initial migrations over restored tables.
6. Redeploy Render with maintenance still enabled. Check `/health/live` returns
   200 and `/health` returns 200 with `database: up`. Point Render restart checks
   and external uptime monitors at `/health/live` to avoid repeatedly waking Neon.
7. Remove backend maintenance, then remove frontend maintenance and redeploy.
   Test login/token refresh, companies, questions, search, progress, notes,
   bookmarks, and dashboard using a test account. Confirm a new insert works with
   restored sequences. Existing tabs can reload. Authentication tokens retain the
   same validity/expiration rules; the migration does not extend expired tokens.
8. Stop DB readiness polling, allow Neon to suspend naturally, then test the first
   database request and recovery. The pool has a 10s connection deadline; readiness
   has a 5s response deadline and may briefly return 503 during a slow wake-up.
   Measure before tuning these deadlines; do not automatically retry writes.

## Rollback and retention

Before writes reopen, restore previous deployment variables and redeploy against
Aiven. After writes reach Neon, freeze traffic and reconcile/transfer all new
records back before reverting: switching directly to stale Aiven loses updates.
Keep Aiven and the final protected backup for at least seven days after a verified
cutover. Retire them only after that retention period and successful observation.

Reference: [Neon's PostgreSQL migration guide](https://neon.com/docs/import/migrate-from-postgres).
