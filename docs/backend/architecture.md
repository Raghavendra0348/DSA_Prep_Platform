# 🏗️ Backend Architecture

**Stack:** Node.js 22 · Express 5 · Prisma v7 · PostgreSQL · JWT · bcrypt  
**Last Updated:** August 9, 2026

---

## File Structure

```
backend/
├── .env                          ← DB URL, JWT secret, PORT, CORS (gitignored)
├── package.json                  ← scripts: dev | start | import | studio
├── prisma.config.ts              ← Prisma v7 config (reads DATABASE_URL)
│
├── prisma/
│   ├── schema.prisma             ← 6 models, indexes, relations
│   └── migrations/
│       └── 0_init/
│           └── migration.sql     ← baseline migration (already applied)
│
├── scripts/
│   ├── import-data.js            ← CSV → PostgreSQL (run once)
│   └── setup-db.sh               ← helper for DB creation
│
└── src/
    ├── app.js                    ← Express app: middleware + all routes
    ├── server.js                 ← HTTP server entry point
    ├── lib/
    │   └── prisma.js             ← singleton Prisma client (v7 pg adapter)
    ├── middleware/
    │   ├── authenticate.js       ← JWT verification → sets req.user
    │   └── errorHandler.js       ← global error → JSON response
    └── routes/
        ├── companies.js          ← GET /api/companies
        ├── company.js            ← GET /api/company/:slug (auth-aware)
        ├── search.js             ← GET /api/search
        ├── topics.js             ← GET /api/topics + /:topic
        ├── stats.js              ← GET /api/stats
        ├── auth.js               ← POST /register | POST /login
        ├── progress.js           ← GET/POST /api/progress + POST /bulk
        ├── bookmarks.js          ← GET/POST /api/bookmarks
        └── dashboard.js          ← GET /api/dashboard
```

---

## Database Schema

### Models Overview

```
Company            Question           CompanyQuestion (join table)
───────────        ────────────       ───────────────────────────
id (PK, auto)      id (PK, auto)      companyId  → Company.id
name (unique)      slug (unique)      questionId → Question.id
slug (unique)      title              period     (30days|3months|6months|6plus|all)
                   difficulty         frequency
                   link               acceptanceRate
                   topics[]           ── composite PK: [companyId, questionId, period]

User               Progress           Bookmark
────────────       ────────────       ────────────
id (UUID, PK)      userId → User.id   userId → User.id
email (unique)     questionId → Q.id  questionId → Q.id
name               status             createdAt
password (hashed)  updatedAt          ── composite PK: [userId, questionId]
avatar?
createdAt
```

### Prisma Schema (Condensed)

```prisma
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
  difficulty String            // "EASY" | "MEDIUM" | "HARD"
  link       String
  topics     String[]          // PostgreSQL native array
  @@index([difficulty])
  @@index([title])
}

model User {
  id        String     @id @default(uuid())
  email     String     @unique
  name      String
  password  String     // bcrypt hashed
  avatar    String?
  createdAt DateTime   @default(now())
}

model Progress {
  userId     String
  questionId Int
  status     String   // "solved" | "attempted" | "not-started"
  updatedAt  DateTime @updatedAt
  @@id([userId, questionId])  // one record per user+question
}
```

### Indexes

| Table | Index | Purpose |
|---|---|---|
| Question | `difficulty` | Fast easy/medium/hard filter |
| Question | `title` | Fast title search |
| CompanyQuestion | `[companyId, period]` | Main company page query |
| CompanyQuestion | `questionId` | Reverse lookup |

---

## Data Import

471 company folders from `leetcode-company-wise-problems/` are imported **once** into PostgreSQL via `npm run import`.

**Result:**
- 471 Companies
- 3,257 unique Questions
- ~50,000 CompanyQuestion links (across 5 time periods)
- 74 unique Topics

After import, CSVs are never read again. All queries go through Prisma → PostgreSQL.

---

## Security

| Feature | Implementation |
|---|---|
| Password hashing | bcrypt (10 rounds) |
| Auth tokens | JWT, 7-day expiry |
| HTTP headers | helmet middleware |
| CORS | Restricted to `CORS_ORIGIN` env var |
| Rate limiting (auth) | 10 requests / 15 minutes / IP |
| Rate limiting (API) | 100 requests / minute / IP |

---

## Prisma v7 — Key Notes

Prisma v7 changed how the client is initialized:

```js
// src/lib/prisma.js
const { PrismaClient } = require('../../generated/prisma/client.ts');
const { PrismaPg }     = require('@prisma/adapter-pg');
const { Pool }         = require('pg');

const pool    = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter });
```

- `url` is **no longer** in `schema.prisma` — it's in `prisma.config.ts`
- Generated client is at `generated/prisma/client.ts` (not `@prisma/client`)
- Driver adapter (`@prisma/adapter-pg`) is required

---

## Migrations

```
prisma/migrations/
└── 0_init/
    └── migration.sql   ← baseline — current schema captured
```

**For future schema changes:**
```bash
# 1. Edit prisma/schema.prisma
# 2. Create + apply migration:
npx prisma migrate dev --name describe_your_change
# 3. Regenerate client:
npx prisma generate
```

> ⚠️ Never use `db push` in production — always use migrations.

---

## npm Scripts

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `nodemon src/server.js` | Dev server with auto-restart |
| `npm start` | `node src/server.js` | Production start |
| `npm run import` | `node scripts/import-data.js` | One-time CSV data import |
| `npm run studio` | `npx prisma studio` | Visual DB browser at :5555 |
