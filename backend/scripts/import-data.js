const { PrismaClient } = require('../generated/prisma/client.ts');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { parse } = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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

function normalize(row) {
  return {
    slug:           slugify(row.Title),
    title:          row.Title.trim(),
    difficulty:     row.Difficulty.trim().toUpperCase(),
    link:           row.Link.trim(),
    topics:         row.Topics ? row.Topics.split(',').map(t => t.trim()).filter(Boolean) : [],
    frequency:      parseFloat(row.Frequency) || 0,
    acceptanceRate: Math.round(parseFloat(row['Acceptance Rate']) * 100 * 10) / 10,
  };
}

async function main() {
  const folders = fs.readdirSync(DATA_ROOT).filter(f =>
    fs.statSync(path.join(DATA_ROOT, f)).isDirectory()
  );

  console.log(`Found ${folders.length} company folders\n`);

  for (const folder of folders) {
    const companyName = folder;
    const slug = slugify(folder);

    const company = await prisma.company.upsert({
      where: { slug },
      update: {},
      create: { name: companyName, slug },
    });

    console.log(`Importing ${companyName}...`);

    for (const [period, filename] of Object.entries(PERIOD_FILES)) {
      const filePath = path.join(DATA_ROOT, folder, filename);
      if (!fs.existsSync(filePath)) continue;

      const content = fs.readFileSync(filePath, 'utf-8');
      const rows = parse(content, { columns: true, skip_empty_lines: true });

      for (const row of rows) {
        const data = normalize(row);

        const question = await prisma.question.upsert({
          where: { slug: data.slug },
          update: { topics: data.topics },
          create: {
            slug:       data.slug,
            title:      data.title,
            difficulty: data.difficulty,
            link:       data.link,
            topics:     data.topics,
          },
        });

        await prisma.companyQuestion.upsert({
          where: {
            companyId_questionId_period: {
              companyId:  company.id,
              questionId: question.id,
              period,
            },
          },
          update: { frequency: data.frequency, acceptanceRate: data.acceptanceRate },
          create: {
            companyId:      company.id,
            questionId:     question.id,
            period,
            frequency:      data.frequency,
            acceptanceRate: data.acceptanceRate,
          },
        });
      }
    }
    console.log(`  ✅ ${companyName} done`);
  }

  console.log('\n🎉 Import complete!');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
