# 🔧 Backend — Current State Reference

**Last Updated:** August 8, 2026
**Stack:** Node.js 22 · Express · Prisma v7 · PostgreSQL (`dsa_db`) · JWT · bcrypt

> This document reflects the **actual implemented state** of the backend.
> It supersedes the original `IMPLEMENTATION_PLAN_BACKEND.md` for anything marked ✅.

---

## Quick Start

```bash
cd backend
npm install                          # install all dependencies
npx prisma generate                  # generate Prisma client
npx prisma migrate deploy            # apply migrations to DB
npm run import                       # one-time CSV import (471 companies)
npm run dev                          # start server on :5000
```

**Test it:**

```bash
curl http://localhost:5000/health    # → {"status":"ok"}
curl http://localhost:5000/api/stats # → 471 companies, 3257 questions
```

---

## Environment Variables (`.env`)

```env
DATABASE_URL="postgresql://postgres:rgukt123@localhost:5432/dsa_db"
JWT_SECRET="your_super_secret_key_change_this_in_production"
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

> ⚠️ `.env` is gitignored — never commit it.

---

## File Structure

```
backend/
├── .env                          ← DB URL, JWT secret, PORT, CORS
├── .gitignore                    ← node_modules, .env, generated/
├── package.json                  ← scripts: dev | start | import | studio
├── prisma.config.ts              ← Prisma v7 config (reads DATABASE_URL)
├── prisma/
│   ├── schema.prisma             ← 6 models, indexes, relations
│   └── migrations/
│       └── 0_init/
│           └── migration.sql     ← baseline migration (already applied)
├── scripts/
│   ├── import-data.js            ← CSV → PostgreSQL (run once)
│   └── setup-db.sh               ← helper for DB creation
├── src/
│   ├── app.js                    ← Express app: middleware + all routes
│   ├── server.js                 ← HTTP server entry point
│   ├── lib/
│   │   └── prisma.js             ← singleton Prisma client (v7 pg adapter)
│   ├── middleware/
│   │   ├── authenticate.js       ← JWT verification → sets req.user
│   │   └── errorHandler.js       ← global error → JSON response
│   └── routes/
│       ├── companies.js          ← GET /api/companies
│       ├── company.js            ← GET /api/company/:slug (auth-aware)
│       ├── search.js             ← GET /api/search
│       ├── topics.js             ← GET /api/topics + /:topic
│       ├── stats.js              ← GET /api/stats
│       ├── auth.js               ← POST /register | POST /login
│       ├── progress.js           ← GET/POST /api/progress + POST /bulk
│       ├── bookmarks.js          ← GET/POST /api/bookmarks
│       └── dashboard.js          ← GET /api/dashboard
└── generated/                    ← gitignored — rebuild with npx prisma generate
```

---

## Database Schema

### Models

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

### Indexes

| Table           | Index                   | Purpose                      |
| --------------- | ----------------------- | ---------------------------- |
| Question        | `difficulty`          | Fast easy/medium/hard filter |
| Question        | `title`               | Fast title search            |
| CompanyQuestion | `[companyId, period]` | Main company page query      |
| CompanyQuestion | `questionId`          | Reverse lookup               |

---

## API Reference

### Rate Limits

| Route group                  | Limit                         |
| ---------------------------- | ----------------------------- |
| `/api/auth/*`, `/api/me` | 10 requests / 15 minutes / IP |
| All other`/api/*`          | 100 requests / minute / IP    |

---

### Public Routes (no auth required)

#### `GET /health`

```json
{ "status": "ok" }
```

---

#### `GET /api/stats`

```json
{
  "success": true,
  "stats": {
    "totalCompanies": 471,
    "totalQuestions": 3257,
    "totalUsers": 0,
    "totalTopics": 74,
    "lastUpdated": "2025-06-01",
    "difficultyBreakdown": { "EASY": 787, "MEDIUM": 1731, "HARD": 739 }
  }
}
```

---

#### `GET /api/companies`

Returns all 471 companies with question count and top topics.

```json
{
  "success": true,
  "total": 471,
  "companies": [
    { "name": "Google", "slug": "google", "questionCount": 443, "topTopics": ["Array","DP","Tree","Graph","String"] }
  ]
}
```

---

#### `GET /api/company/:slug`

| Query param    | Values                                              | Default       |
| -------------- | --------------------------------------------------- | ------------- |
| `period`     | `30days \| 3months \| 6months \| 6plus \| all`        | `all`       |
| `difficulty` | `EASY,MEDIUM,HARD` (comma-separated)              | —            |
| `topics`     | `Array,Dynamic Programming` (comma-separated)     | —            |
| `sortBy`     | `frequency \| acceptanceRate \| difficulty \| title` | `frequency` |
| `page`       | integer                                             | `1`         |
| `limit`      | integer (max 200)                                   | `50`        |

**When authenticated** (Bearer token in header), each problem includes `status` and `bookmarked`:

```json
{
  "success": true,
  "company": "Google",
  "slug": "google",
  "period": "30days",
  "authenticated": true,
  "pagination": { "page": 1, "limit": 50, "total": 172, "totalPages": 4 },
  "problems": [
    {
      "id": 3,
      "slug": "two-sum",
      "title": "Two Sum",
      "difficulty": "EASY",
      "link": "https://leetcode.com/problems/two-sum",
      "topics": ["Array", "Hash Table"],
      "frequency": 100,
      "acceptanceRate": 54.2,
      "status": "solved",
      "bookmarked": true
    }
  ]
}
```

> When not authenticated: `status: null`, `bookmarked: null`

---

#### `GET /api/company/:slug/stats`

```json
{
  "company": "Google",
  "stats": {
    "30days":  { "total": 172, "easy": 45, "medium": 89, "hard": 38, "topTopics": [...] },
    "3months": { "total": 289, "easy": 72, "medium": 148, "hard": 69, "topTopics": [...] }
  }
}
```

---

#### `GET /api/search?q=two+sum`

| Param          | Description               |
| -------------- | ------------------------- |
| `q`          | search term (min 2 chars) |
| `difficulty` | `EASY \| MEDIUM \| HARD`  |
| `limit`      | max 100, default 20       |

```json
{
  "success": true, "query": "two sum", "total": 6,
  "results": [
    { "id": 3, "title": "Two Sum", "difficulty": "EASY", "companyCount": 115,
      "companies": [{ "name": "Google", "slug": "google", "frequency": 100 }] }
  ]
}
```

---

#### `GET /api/topics`

```json
{
  "success": true, "total": 74,
  "topics": [
    { "name": "Array", "slug": "array", "problemCount": 1856 }
  ]
}
```

#### `GET /api/topics/:topic`

| Param                | Description              |
| -------------------- | ------------------------ |
| `difficulty`       | `EASY \| MEDIUM \| HARD` |
| `page` / `limit` | pagination               |

> Topic slug is case-insensitive: `/api/topics/dynamic-programming` correctly resolves to `"Dynamic Programming"`

---

### Auth Routes

#### `POST /api/auth/register`

```json
// Request body:
{ "email": "user@gmail.com", "name": "Ravi", "password": "mypass123" }

// Validations:
// - email must be valid format
// - password minimum 6 characters
// - name cannot be blank

// Response 201:
{ "success": true, "token": "eyJhbG...", "user": { "id": "uuid", "name": "Ravi", "email": "user@gmail.com" } }
```

#### `POST /api/auth/login`

```json
// Request body:
{ "email": "user@gmail.com", "password": "mypass123" }

// Response 200:
{ "success": true, "token": "eyJhbG...", "user": { "id": "uuid", "name": "Ravi", "email": "user@gmail.com" } }
```

> JWT tokens expire in **7 days**. All protected routes require:
> `Authorization: Bearer <token>`

---

### Protected Routes (JWT required)

#### `GET /api/me`

```json
{
  "success": true,
  "user": { "id": "uuid", "name": "Ravi", "email": "user@gmail.com", "avatar": null, "createdAt": "..." }
}
```

---

#### `GET /api/dashboard`

Returns complete user stats in one call (all parallel DB queries):

```json
{
  "success": true,
  "overview": {
    "totalSolved": 42,
    "totalAttempted": 17,
    "totalBookmarks": 8,
    "totalQuestions": 3257
  },
  "difficulty": { "easy": 15, "medium": 22, "hard": 5 },
  "topCompanies": [
    { "name": "Google", "slug": "google", "solvedCount": 12 }
  ],
  "topTopics": [
    { "name": "Dynamic Programming", "solvedCount": 9 }
  ],
  "recentActivity": [
    { "questionId": 3, "slug": "two-sum", "title": "Two Sum", "difficulty": "EASY", "status": "solved", "updatedAt": "..." }
  ]
}
```

---

#### `GET /api/progress`

Returns all progress records for the logged-in user.

```json
{
  "success": true,
  "progress": [
    { "questionId": 3, "status": "solved", "updatedAt": "...", "question": { "slug": "two-sum", "title": "Two Sum" } }
  ]
}
```

#### `POST /api/progress`

```json
// Body: { "questionId": 3, "status": "solved" }
// status values: "solved" | "attempted" | "not-started"
{ "success": true, "progress": { "userId": "...", "questionId": 3, "status": "solved", "updatedAt": "..." } }
```

#### `POST /api/progress/bulk`

Fetch statuses for many question IDs in one request (for company page rendering):

```json
// Body: { "questionIds": [3, 7, 15, 22] }  (max 500)

// Response — only questions with a status are included (absent = not-started):
{ "success": true, "progress": { "3": "solved", "7": "attempted" } }
```

---

#### `GET /api/bookmarks`

```json
{
  "success": true,
  "bookmarks": [
    { "questionId": 3, "createdAt": "...", "question": { "id": 3, "slug": "two-sum", "title": "Two Sum", ... } }
  ]
}
```

#### `POST /api/bookmarks`

Toggle bookmark on/off:

```json
// Body: { "questionId": 3 }
{ "success": true, "bookmarked": true }   // or false if it was removed
```

---

## Prisma v7 Notes

Prisma v7 changed how the client is initialized. Key differences from older versions:

```js
// src/lib/prisma.js — required pattern for Prisma v7 with PostgreSQL
const { PrismaClient } = require('../../generated/prisma/client.ts');
const { PrismaPg }     = require('@prisma/adapter-pg');
const { Pool }         = require('pg');

const pool    = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter });
```

- `url` is **no longer** in `schema.prisma` — it's in `prisma.config.ts`
- Generated client is at `generated/prisma/client.ts` (not `@prisma/client`)
- Driver adapter (`@prisma/adapter-pg`) is required for direct PostgreSQL connections

---

## npm Scripts

| Script             | Command                         | Purpose                      |
| ------------------ | ------------------------------- | ---------------------------- |
| `npm run dev`    | `nodemon src/server.js`       | Dev server with auto-restart |
| `npm start`      | `node src/server.js`          | Production start             |
| `npm run import` | `node scripts/import-data.js` | One-time CSV data import     |
| `npm run studio` | `npx prisma studio`           | Visual DB browser at :5555   |

---

## Data Import Summary

Run **once** after DB setup. Takes ~2 minutes.

```bash
npm run import
# Found 471 company folders
# ✅ AMD done
# ✅ Amazon done
# ... (471 companies)
# 🎉 Import complete!
```

**Result:**

- 471 Companies
- 3,257 unique Questions
- ~50,000 CompanyQuestion links (across 5 time periods)
- 74 unique Topics

---

## Migrations

The project uses **Prisma Migrate** (not just `db push`).

```
prisma/migrations/
└── 0_init/
    └── migration.sql    ← baseline — captures current schema
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
