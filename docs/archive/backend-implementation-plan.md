# 🛠️ Implementation Plan — Database & Backend

## DSA Interview Prep Platform

**Stack:** PostgreSQL · Prisma ORM · Node.js · Express · JWT

> **📌 Status as of August 8, 2026: IMPLEMENTATION COMPLETE**
>
> This document was the original planning reference. The backend is now fully built and running.
> For the **current, accurate API reference** see: [`BACKEND_REFERENCE.md`](./BACKEND_REFERENCE.md)
>
> **What was built vs planned:**
>
> - ✅ All Phase 0–3 items complete
> - ✅ Prisma v7 (plan assumed v4/v5 — adapter pattern required)
> - ✅ Migrations baseline created (`prisma/migrations/0_init/`)
> - ✅ Additional endpoints beyond plan: `/api/dashboard`, `/api/progress/bulk`, `/api/me`
> - ✅ Rate limiting applied (was in plan, is now live)
> - ✅ Topics case-mismatch bug fixed
> - ✅ Stats endpoint parallelized (Promise.all)
> - ✅ Company endpoint is auth-aware (returns `status` + `bookmarked` for logged-in users)
>
> **DB credentials used (local dev):** `postgres / rgukt123 @ localhost:5432 / dsa_db`

---

## Phase 0 — Database Setup

### Step 0.1 — Install PostgreSQL Locally

```bash
sudo apt install postgresql postgresql-contrib
sudo service postgresql start
sudo -u postgres psql

# Inside psql:
CREATE DATABASE dsa_db;
CREATE USER dsa_user WITH PASSWORD 'dsa1234';
GRANT ALL PRIVILEGES ON DATABASE dsa_db TO dsa_user;
\q
```

---

### Step 0.2 — Project Init

```bash
mkdir backend && cd backend
npm init -y
npm install express prisma @prisma/client csv-parse bcryptjs jsonwebtoken cors helmet express-rate-limit dotenv
npm install --save-dev nodemon
npx prisma init
```

**`package.json` scripts:**

```json
{
  "scripts": {
    "dev":    "nodemon src/server.js",
    "start":  "node src/server.js",
    "import": "node scripts/import-data.js",
    "studio": "npx prisma studio"
  }
}
```

**`.env`:**

```env
DATABASE_URL="postgresql://dsa_user:dsa1234@localhost:5432/dsa_db"
JWT_SECRET="your_super_secret_key_here"
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

---

### Step 0.3 — Prisma Schema

**File:** `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Company {
  id        Int               @id @default(autoincrement())
  name      String            @unique
  slug      String            @unique
  questions CompanyQuestion[]
}

model Question {
  id         Int               @id @default(autoincrement())
  slug       String            @unique
  title      String
  difficulty String
  link       String
  topics     String[]
  companies  CompanyQuestion[]
  progress   Progress[]
  bookmarks  Bookmark[]

  @@index([difficulty])
  @@index([title])
}

model CompanyQuestion {
  companyId      Int
  questionId     Int
  period         String
  frequency      Float
  acceptanceRate Float

  company  Company  @relation(fields: [companyId], references: [id])
  question Question @relation(fields: [questionId], references: [id])

  @@id([companyId, questionId, period])
  @@index([companyId, period])
  @@index([questionId])
}

model User {
  id        String     @id @default(uuid())
  email     String     @unique
  name      String
  password  String
  avatar    String?
  createdAt DateTime   @default(now())
  progress  Progress[]
  bookmarks Bookmark[]
}

model Progress {
  userId     String
  questionId Int
  status     String   // "solved" | "attempted" | "not-started"
  updatedAt  DateTime @updatedAt

  user     User     @relation(fields: [userId], references: [id])
  question Question @relation(fields: [questionId], references: [id])

  @@id([userId, questionId])
}

model Bookmark {
  userId     String
  questionId Int
  createdAt  DateTime @default(now())

  user     User     @relation(fields: [userId], references: [id])
  question Question @relation(fields: [questionId], references: [id])

  @@id([userId, questionId])
}
```

```bash
npx prisma generate     # generate client
npx prisma db push      # create tables
npx prisma studio       # verify at localhost:5555
```

✅ **Checkpoint:** All 6 tables visible in Prisma Studio.

---

### Step 0.4 — CSV Import Script

**File:** `scripts/import-data.js`

```js
const { PrismaClient } = require('@prisma/client');
const { parse } = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const DATA_ROOT = path.join(__dirname, '../../data/leetcode-company-wise-problems');

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
```

```bash
npm run import
# Takes ~1-2 minutes. Run only once.
```

✅ **Checkpoint:** Prisma Studio shows data in all tables.

---

## Phase 1 — Express Server Setup

### Step 1.1 — App & Server

**File:** `src/app.js`

```js
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
require('dotenv').config();

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

// Routes
app.use('/api/companies', require('./routes/companies'));
app.use('/api/company',   require('./routes/company'));
app.use('/api/search',    require('./routes/search'));
app.use('/api/topics',    require('./routes/topics'));
app.use('/api/stats',     require('./routes/stats'));
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/progress',  require('./routes/progress'));
app.use('/api/bookmarks', require('./routes/bookmarks'));
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Global error handler
app.use(require('./middleware/errorHandler'));

module.exports = app;
```

**File:** `src/server.js`

```js
const app  = require('./app');
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

**File:** `src/lib/prisma.js`

```js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
module.exports = prisma;
```

---

### Step 1.2 — Error Handler Middleware

**File:** `src/middleware/errorHandler.js`

```js
module.exports = (err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    error:   err.message || 'Internal server error',
    code:    err.code    || 'INTERNAL_ERROR',
  });
};
```

**File:** `src/middleware/authenticate.js`

```js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

---

## Phase 2 — API Routes

### Step 2.1 — GET /api/companies

**File:** `src/routes/companies.js`

```js
const router  = require('express').Router();
const prisma  = require('../lib/prisma');

router.get('/', async (req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        questions: {
          where:   { period: 'all' },
          select:  { frequency: true, question: { select: { topics: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    const result = companies.map(c => ({
      name:          c.name,
      slug:          c.slug,
      questionCount: c.questions.length,
      topTopics:     getTopTopics(c.questions),
    }));

    res.json({ success: true, total: result.length, companies: result });
  } catch (e) { next(e); }
});

function getTopTopics(questions) {
  const freq = {};
  questions.forEach(q => q.question.topics.forEach(t => freq[t] = (freq[t] || 0) + 1));
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);
}

module.exports = router;
```

---

### Step 2.2 — GET /api/company/:slug

**File:** `src/routes/company.js`

```js
const router = require('express').Router();
const prisma = require('../lib/prisma');

const VALID_PERIODS = ['30days','3months','6months','6plus','all'];
const VALID_SORT    = ['frequency','acceptanceRate','difficulty'];

router.get('/:slug', async (req, res, next) => {
  try {
    const { slug }                                           = req.params;
    const { period = 'all', difficulty, topics, sortBy = 'frequency', page = 1, limit = 50 } = req.query;

    if (!VALID_PERIODS.includes(period))
      return res.status(400).json({ error: 'Invalid period', code: 'INVALID_PERIOD' });

    const company = await prisma.company.findUnique({ where: { slug } });
    if (!company)
      return res.status(404).json({ error: 'Company not found', code: 'COMPANY_NOT_FOUND' });

    const where = {
      companyId: company.id,
      period,
      ...(difficulty && { question: { difficulty: { in: difficulty.split(',') } } }),
    };

    const [rows, total] = await Promise.all([
      prisma.companyQuestion.findMany({
        where,
        include: { question: true },
        orderBy: VALID_SORT.includes(sortBy) ? { [sortBy]: 'desc' } : { frequency: 'desc' },
        take:    Math.min(Number(limit), 200),
        skip:    (Number(page) - 1) * Math.min(Number(limit), 200),
      }),
      prisma.companyQuestion.count({ where }),
    ]);

    res.json({
      success: true, company: company.name, period,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
      problems: rows.map(r => ({ ...r.question, frequency: r.frequency, acceptanceRate: r.acceptanceRate })),
    });
  } catch (e) { next(e); }
});

router.get('/:slug/stats', async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({ where: { slug: req.params.slug } });
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const stats = {};
    for (const period of ['30days','3months','6months','6plus','all']) {
      const rows = await prisma.companyQuestion.findMany({
        where: { companyId: company.id, period },
        include: { question: { select: { difficulty: true, topics: true } } },
      });
      if (!rows.length) continue;
      const topicMap = {};
      rows.forEach(r => r.question.topics.forEach(t => topicMap[t] = (topicMap[t]||0)+1));
      stats[period] = {
        total:     rows.length,
        easy:      rows.filter(r => r.question.difficulty === 'EASY').length,
        medium:    rows.filter(r => r.question.difficulty === 'MEDIUM').length,
        hard:      rows.filter(r => r.question.difficulty === 'HARD').length,
        topTopics: Object.entries(topicMap).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([t])=>t),
      };
    }
    res.json({ success: true, company: company.name, stats });
  } catch (e) { next(e); }
});

module.exports = router;
```

---

### Step 2.3 — GET /api/search

**File:** `src/routes/search.js`

```js
const router = require('express').Router();
const prisma = require('../lib/prisma');

router.get('/', async (req, res, next) => {
  try {
    const { q, difficulty, limit = 20 } = req.query;
    if (!q || q.length < 2)
      return res.status(400).json({ error: 'Query must be at least 2 characters' });

    const questions = await prisma.question.findMany({
      where: {
        title: { contains: q, mode: 'insensitive' },
        ...(difficulty && { difficulty }),
      },
      include: {
        companies: {
          include: { company: { select: { name: true, slug: true } } },
          where:   { period: 'all' },
          orderBy: { frequency: 'desc' },
        },
      },
      take: Math.min(Number(limit), 100),
    });

    res.json({
      success: true, query: q, total: questions.length,
      results: questions.map(q => ({
        id: q.id, slug: q.slug, title: q.title,
        difficulty: q.difficulty, topics: q.topics, link: q.link,
        companyCount: q.companies.length,
        companies: q.companies.map(c => ({ name: c.company.name, slug: c.company.slug, frequency: c.frequency })),
      })),
    });
  } catch (e) { next(e); }
});

module.exports = router;
```

---

### Step 2.4 — GET /api/topics

**File:** `src/routes/topics.js`

```js
const router = require('express').Router();
const prisma = require('../lib/prisma');

router.get('/', async (req, res, next) => {
  try {
    const questions = await prisma.question.findMany({ select: { topics: true } });
    const map = {};
    questions.forEach(q => q.topics.forEach(t => map[t] = (map[t]||0)+1));
    const topics = Object.entries(map)
      .sort((a,b) => b[1]-a[1])
      .map(([name, count]) => ({ name, slug: name.toLowerCase().replace(/\s+/g,'-'), problemCount: count }));
    res.json({ success: true, total: topics.length, topics });
  } catch (e) { next(e); }
});

router.get('/:topic', async (req, res, next) => {
  try {
    const { topic } = req.params;
    const { page = 1, limit = 50, difficulty } = req.query;
    const topicName = topic.replace(/-/g,' ');

    const where = {
      topics: { has: topicName },
      ...(difficulty && { difficulty }),
    };

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        take: Math.min(Number(limit),200),
        skip: (Number(page)-1)*Math.min(Number(limit),200),
      }),
      prisma.question.count({ where }),
    ]);

    res.json({ success: true, topic: topicName, total, questions });
  } catch (e) { next(e); }
});

module.exports = router;
```

---

### Step 2.5 — GET /api/stats

**File:** `src/routes/stats.js`

```js
const router = require('express').Router();
const prisma = require('../lib/prisma');

router.get('/', async (req, res, next) => {
  try {
    const [companies, questions, users] = await Promise.all([
      prisma.company.count(),
      prisma.question.count(),
      prisma.user.count(),
    ]);

    const byDiff = await prisma.question.groupBy({
      by: ['difficulty'],
      _count: { id: true },
    });

    const allQuestions = await prisma.question.findMany({ select: { topics: true } });
    const topicMap = {};
    allQuestions.forEach(q => q.topics.forEach(t => topicMap[t]=(topicMap[t]||0)+1));

    res.json({
      success: true,
      stats: {
        totalCompanies:   companies,
        totalQuestions:   questions,
        totalUsers:       users,
        totalTopics:      Object.keys(topicMap).length,
        lastUpdated:      '2025-06-01',
        difficultyBreakdown: Object.fromEntries(byDiff.map(d => [d.difficulty, d._count.id])),
      },
    });
  } catch (e) { next(e); }
});

module.exports = router;
```

---

### Step 2.6 — Auth Routes

**File:** `src/routes/auth.js`

```js
const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const prisma  = require('../lib/prisma');

router.post('/register', async (req, res, next) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password)
      return res.status(400).json({ error: 'All fields required' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user   = await prisma.user.create({ data: { email, name, password: hashed } });
    const token  = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ success: true, token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.password))
      return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) { next(e); }
});

module.exports = router;
```

---

### Step 2.7 — Progress Routes

**File:** `src/routes/progress.js`

```js
const router       = require('express').Router();
const prisma       = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const progress = await prisma.progress.findMany({
      where:   { userId: req.user.id },
      include: { question: { select: { slug: true, title: true } } },
    });
    res.json({ success: true, progress });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { questionId, status } = req.body;
    const validStatuses = ['solved','attempted','not-started'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ error: 'Invalid status' });

    const progress = await prisma.progress.upsert({
      where:  { userId_questionId: { userId: req.user.id, questionId: Number(questionId) } },
      update: { status },
      create: { userId: req.user.id, questionId: Number(questionId), status },
    });
    res.json({ success: true, progress });
  } catch (e) { next(e); }
});

module.exports = router;
```

---

### Step 2.8 — Bookmarks Routes

**File:** `src/routes/bookmarks.js`

```js
const router       = require('express').Router();
const prisma       = require('../lib/prisma');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where:   { userId: req.user.id },
      include: { question: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, bookmarks });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { questionId } = req.body;
    const key = { userId: req.user.id, questionId: Number(questionId) };
    const exists = await prisma.bookmark.findUnique({ where: { userId_questionId: key } });

    if (exists) {
      await prisma.bookmark.delete({ where: { userId_questionId: key } });
      return res.json({ success: true, bookmarked: false });
    }
    await prisma.bookmark.create({ data: key });
    res.json({ success: true, bookmarked: true });
  } catch (e) { next(e); }
});

module.exports = router;
```

---

## Phase 3 — Testing Checklist

Run server: `npm run dev`

| Test      | Command                                                     | Expected               |
| --------- | ----------------------------------------------------------- | ---------------------- |
| Health    | `curl localhost:5000/health`                              | `{ status: 'ok' }`   |
| Companies | `curl localhost:5000/api/companies`                       | 471 companies          |
| Company   | `curl "localhost:5000/api/company/google?period=30days"`  | Problems list          |
| Stats     | `curl "localhost:5000/api/company/google/stats"`          | Difficulty breakdown   |
| Search    | `curl "localhost:5000/api/search?q=two+sum"`              | Results with companies |
| Topics    | `curl localhost:5000/api/topics`                          | Topic list             |
| Register  | POST`/api/auth/register` with `{email, name, password}` | JWT token              |
| Login     | POST`/api/auth/login`                                     | JWT token              |
| Progress  | POST`/api/progress` with JWT                              | Upserted progress      |
| Bookmark  | POST`/api/bookmarks` with JWT                             | Toggle bookmark        |

---

## Phase 4 — Deploy to Production

### Step 4.1 — Switch to Aiven

1. Sign up at [aiven.io](https://aiven.io) → create free PostgreSQL
2. Copy connection string
3. Update `.env.production`:

```env
DATABASE_URL="postgresql://user:pass@host.aivencloud.com:PORT/dsa_db?sslmode=require"
```

4. Run schema + import against Aiven:

```bash
npx prisma db push
npm run import
```

### Step 4.2 — Deploy Backend to Railway

```bash
# Push to GitHub
# Railway: New Project → Deploy from GitHub repo
# Add env vars: DATABASE_URL, JWT_SECRET, PORT, CORS_ORIGIN
```

✅ Backend live at `https://your-app.railway.app`

---

## Summary — Build Order

```
Day 1:  Step 0.1 → 0.3  (PostgreSQL + Prisma schema)
Day 2:  Step 0.4        (CSV import script — run it)
Day 3:  Step 1.1 → 1.2  (Express server + middleware)
Day 4:  Step 2.1 → 2.3  (companies, company, search routes)
Day 5:  Step 2.4 → 2.5  (topics, stats routes)
Day 6:  Step 2.6 → 2.8  (auth, progress, bookmarks routes)
Day 7:  Step 3          (full test all endpoints)
Day 8:  Step 4          (deploy Aiven + Railway)
```
