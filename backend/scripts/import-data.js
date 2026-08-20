/**
 * FAST bulk import script — uses raw SQL with COPY/batch INSERT instead of
 * one-query-per-row Prisma upserts. Reduces ~50,000 round trips → ~20 batches.
 * 
 * Strategy:
 *  1. Read ALL CSV files into memory first (no DB calls)
 *  2. Bulk-insert all Companies in one query
 *  3. Bulk-insert all Questions in one query (with ON CONFLICT DO UPDATE)
 *  4. Bulk-insert all CompanyQuestion links in batched chunks
 */

const { Pool } = require('pg');
const { parse } = require('csv-parse/sync');
const fs   = require('fs');
const path = require('path');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Aiven SSL from local machine

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

const DATA_ROOT = path.join(__dirname, '../../leetcode-company-wise-problems');

const PERIOD_FILES = {
  '30days':  '1. Thirty Days.csv',
  '3months': '2. Three Months.csv',
  '6months': '3. Six Months.csv',
  '6plus':   '4. More Than Six Months.csv',
  'all':     '5. All.csv',
};

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Split array into chunks of size n
function chunks(arr, n) {
  const result = [];
  for (let i = 0; i < arr.length; i += n) result.push(arr.slice(i, i + n));
  return result;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const client = await pool.connect();

  try {
    const folders = fs.readdirSync(DATA_ROOT).filter(f =>
      fs.statSync(path.join(DATA_ROOT, f)).isDirectory()
    );
    console.log(`📂 Found ${folders.length} company folders — reading CSVs into memory...`);

    // ── Step 1: Read all data into memory ─────────────────────────────────────
    const companiesMap   = new Map(); // slug → { name, slug }
    const questionsMap   = new Map(); // slug → { slug, title, difficulty, link, topics }
    const cqRows         = [];        // { companySlug, questionSlug, period, frequency, acceptanceRate }

    for (const folder of folders) {
      const companyName = folder;
      const companySlug = slugify(folder);
      companiesMap.set(companySlug, { name: companyName, slug: companySlug });

      for (const [period, filename] of Object.entries(PERIOD_FILES)) {
        const filePath = path.join(DATA_ROOT, folder, filename);
        if (!fs.existsSync(filePath)) continue;

        const content = fs.readFileSync(filePath, 'utf-8');
        const rows = parse(content, { columns: true, skip_empty_lines: true });

        for (const row of rows) {
          const slug = slugify(row.Title);
          if (!questionsMap.has(slug)) {
            questionsMap.set(slug, {
              slug,
              title:      row.Title.trim(),
              difficulty: row.Difficulty.trim().toUpperCase(),
              link:       row.Link.trim(),
              topics:     row.Topics ? row.Topics.split(',').map(t => t.trim()).filter(Boolean) : [],
            });
          }
          cqRows.push({
            companySlug,
            questionSlug:   slug,
            period,
            frequency:      parseFloat(row.Frequency) || 0,
            acceptanceRate: Math.round(parseFloat(row['Acceptance Rate']) * 100 * 10) / 10,
          });
        }
      }
    }

    const companies = [...companiesMap.values()];
    const questions = [...questionsMap.values()];
    console.log(`✅ Read complete: ${companies.length} companies, ${questions.length} questions, ${cqRows.length} links\n`);

    // ── Step 2: Bulk insert Companies ─────────────────────────────────────────
    console.log('🏢 Inserting companies...');
    for (const batch of chunks(companies, 500)) {
      const vals    = batch.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
      const params  = batch.flatMap(c => [c.name, c.slug]);
      await client.query(
        `INSERT INTO "Company" (name, slug) VALUES ${vals}
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name`,
        params
      );
    }
    console.log(`  ✅ ${companies.length} companies inserted\n`);

    // ── Step 3: Bulk insert Questions ─────────────────────────────────────────
    console.log('❓ Inserting questions...');
    for (const batch of chunks(questions, 200)) {
      const vals   = batch.map((_, i) =>
        `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5}::text[])`
      ).join(', ');
      const params = batch.flatMap(q => [q.slug, q.title, q.difficulty, q.link, q.topics]);
      await client.query(
        `INSERT INTO "Question" (slug, title, difficulty, link, topics) VALUES ${vals}
         ON CONFLICT (slug) DO UPDATE SET topics = EXCLUDED.topics`,
        params
      );
    }
    console.log(`  ✅ ${questions.length} questions inserted\n`);

    // ── Step 4: Fetch ID maps ─────────────────────────────────────────────────
    console.log('🗺️  Loading ID maps...');
    const { rows: companyRows }   = await client.query(`SELECT id, slug FROM "Company"`);
    const { rows: questionRows }  = await client.query(`SELECT id, slug FROM "Question"`);

    const companyId  = Object.fromEntries(companyRows.map(r  => [r.slug, r.id]));
    const questionId = Object.fromEntries(questionRows.map(r => [r.slug, r.id]));

    // ── Step 5: Bulk insert CompanyQuestion links ────────────────────────────
    console.log('🔗 Inserting company-question links...');
    const cqFull = cqRows
      .filter(r => companyId[r.companySlug] && questionId[r.questionSlug])
      .map(r => ({
        companyId:      companyId[r.companySlug],
        questionId:     questionId[r.questionSlug],
        period:         r.period,
        frequency:      r.frequency,
        acceptanceRate: r.acceptanceRate,
      }));

    let inserted = 0;
    for (const batch of chunks(cqFull, 500)) {
      const vals   = batch.map((_, i) =>
        `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`
      ).join(', ');
      const params = batch.flatMap(r => [r.companyId, r.questionId, r.period, r.frequency, r.acceptanceRate]);
      await client.query(
        `INSERT INTO "CompanyQuestion" ("companyId", "questionId", period, frequency, "acceptanceRate")
         VALUES ${vals}
         ON CONFLICT ("companyId", "questionId", period)
         DO UPDATE SET frequency = EXCLUDED.frequency, "acceptanceRate" = EXCLUDED."acceptanceRate"`,
        params
      );
      inserted += batch.length;
      process.stdout.write(`\r  ↳ ${inserted} / ${cqFull.length} links...`);
    }
    console.log(`\n  ✅ ${cqFull.length} company-question links inserted\n`);

    console.log('🎉 Import complete!');

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
