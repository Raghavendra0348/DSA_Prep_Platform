# ✅ Medium + Low Priority Fixes — Implementation Log

**Date:** August 9, 2026  
**Status:** All 9 medium + low priority backend tasks completed.

---

## MEDIUM Priority

---

### M1 — Morgan Request Logging

**Problem:** Zero HTTP request visibility in dev or production. No way to see what requests hit the server or how long they take.

**What I did:**
- Installed `morgan` (`npm install morgan`)
- Added to `src/app.js` with environment-aware format:
  - `dev` mode → compact colored output: `GET /api/stats 200 12ms`
  - `production` → `combined` format (includes IP, user-agent for log aggregators)

**File changed:** `src/app.js`

```js
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}
```

---

### M2 — Pagination on `/api/progress` and `/api/bookmarks`

**Problem:** Both routes returned ALL records with a single `findMany()` — no limit, no pagination. Could dump 1000+ records for active users.

**What I did:**

**`GET /api/progress`** — added query params:
- `page` (default 1)
- `limit` (default 50, max 200)
- `status` — optional filter: `solved | attempted | not-started`

**`GET /api/bookmarks`** — added query params:
- `page` (default 1)
- `limit` (default 20, max 100)

Both now return a `pagination` object:
```json
{
  "pagination": { "page": 1, "limit": 50, "total": 247, "totalPages": 5 },
  "progress": [...]
}
```

**Files changed:** `src/routes/progress.js`, `src/routes/bookmarks.js`

---

### M3 — `notes` + `solvedAt` Fields on Progress

**Problem:** Users could only mark a question's status — no way to save personal notes or track when they first solved it.

**What I did:**

**Schema additions to `Progress` model:**
```prisma
notes    String?    // personal notes per problem
solvedAt DateTime?  // set once when status first → "solved"
```

**Migration created:** `prisma/migrations/20260809180255_add_progress_notes_and_solved_at/`

**API changes in `POST /api/progress`:**
- Body now accepts `notes` (optional string)
- `solvedAt` is automatically set the first time `status === 'solved'` — never overwritten after that (preserves original solve timestamp)

**New endpoint: `PATCH /api/progress/:questionId/notes`**
- Updates only notes without touching status
- Body: `{ notes: "My thinking..." }`

**`POST /api/progress/bulk`** — now also returns `notes` and `solvedAt` in the map.

**Files changed:** `prisma/schema.prisma`, `src/routes/progress.js`

---

### M4 — Extended Search (Topics + Companies)

**Problem:** `GET /api/search?q=...` only matched question titles. Couldn't search by topic name or company name.

**What I did:**
- Rewrote `src/routes/search.js` completely
- Added `type` query param: `questions | topics | companies | all` (default: `all`)
- Runs only the needed DB queries in parallel (skips unused ones)
- Topic search: scans the `topics[]` array field across all questions, finds matching topic names
- Company search: `prisma.company.findMany` with `name: { contains: q, mode: 'insensitive' }`

**New response shape (for `type=all`):**
```json
{
  "query": "dynamic",
  "type": "all",
  "questions": { "total": 12, "results": [...] },
  "topics":    { "total": 3,  "results": [{ "name": "Dynamic Programming", "slug": "dynamic-programming", "problemCount": 584 }] },
  "companies": { "total": 0,  "results": [] }
}
```

**Examples:**
```
GET /api/search?q=two sum               → all types
GET /api/search?q=dynamic&type=topics   → only topics
GET /api/search?q=google&type=companies → only companies
GET /api/search?q=binary&type=questions&difficulty=MEDIUM
```

**File changed:** `src/routes/search.js`

---

## LOW Priority

---

### L1 — Tests with Jest + Supertest

**Problem:** Zero automated tests — every code change required manual Postman testing to verify nothing broke.

**What I did:**
- Installed `jest` and `supertest` as devDependencies
- Created `tests/` folder with 2 test files:

| File | Tests |
|---|---|
| `tests/routes/auth.test.js` | register, login, refresh, logout, /me — 14 test cases |
| `tests/routes/public.test.js` | health, stats, companies, slugs, search (all types), topics — 12 test cases |

- Updated `package.json` with jest config (`testEnvironment: node`, 30s timeout)
- Added `npm test` script: `jest --runInBand --forceExit`

**Key test patterns used:**
- `beforeAll` — clean up leftover test users
- `afterAll` — disconnect Prisma
- Shared token variables across describe blocks (register → save token → use in other tests)

**Run tests:**
```bash
npm test
```

---

### L2 — `.env.example` File

**Problem:** No template for required environment variables — new developers had to guess what to put in `.env`.

**What I did:**
- Created `backend/.env.example` with all 6 env vars documented with comments
- Added note on generating strong secrets: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

**File created:** `.env.example`

---

### L3 — Lightweight Company Slugs Endpoint

**Problem:** `GET /api/companies` is expensive (loads question counts + top topics for 471 companies). Frontend navigation only needs `name + slug`.

**What I did:**
- Added `GET /api/companies/slugs` before the main `GET /api/companies` route
- Single `prisma.company.findMany` with `select: { name: true, slug: true }` — very fast
- Returns `[{ name: "Google", slug: "google" }, ...]`

**File changed:** `src/routes/companies.js`

---

## Files Changed Summary

| File | Action | What Changed |
|---|---|---|
| `src/app.js` | Modified | Added morgan request logging |
| `src/routes/progress.js` | Rewritten | Pagination, Zod, notes support, PATCH /notes, solvedAt |
| `src/routes/bookmarks.js` | Rewritten | Pagination on GET |
| `src/routes/search.js` | Rewritten | Unified search: questions + topics + companies |
| `src/routes/companies.js` | Modified | Added GET /slugs lightweight endpoint |
| `prisma/schema.prisma` | Modified | Added `notes` + `solvedAt` to Progress |
| `prisma/migrations/.../` | Auto-created | DB migration for notes + solvedAt |
| `package.json` | Modified | Added test script + jest config |
| `tests/routes/auth.test.js` | **Created** | 14 auth integration tests |
| `tests/routes/public.test.js` | **Created** | 12 public route integration tests |
| `.env.example` | **Created** | Environment variable template |

---

## New/Changed API Endpoints

| Method | Endpoint | Change |
|---|---|---|
| `GET` | `/api/progress?page=1&limit=50&status=solved` | Added pagination + status filter |
| `POST` | `/api/progress` | Now accepts `notes` field |
| `PATCH` | `/api/progress/:questionId/notes` | **New** — update notes only |
| `POST` | `/api/progress/bulk` | Now returns `notes` + `solvedAt` too |
| `GET` | `/api/bookmarks?page=1&limit=20` | Added pagination |
| `GET` | `/api/search?q=...&type=all\|questions\|topics\|companies` | Extended to topics + companies |
| `GET` | `/api/companies/slugs` | **New** — lightweight name+slug list |

---

## Running Tests

```bash
# Run all tests
npm test

# Run only auth tests
npx jest tests/routes/auth.test.js

# Run only public route tests
npx jest tests/routes/public.test.js
```

> ⚠️ Tests use the real database — make sure `DATABASE_URL` is set in `.env` and the DB is running before running tests. Test data is cleaned up automatically in `beforeAll`/`afterAll`.
