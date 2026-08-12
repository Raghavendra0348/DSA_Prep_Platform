# 🧠 DSA Prep Platform — Complete Codebase Overview

> **Last Updated:** August 11, 2026  
> **Current Phase:** Backend ✅ Complete → Moving to Frontend  
> **Stack:** Node.js · Express 5 · PostgreSQL · Prisma v7 · JWT · Zod

---

## 📁 Project Directory Structure

```
Project DSA/
├── backend/                        ← Main application (Node.js/Express)
│   ├── src/
│   │   ├── app.js                  ← Express app setup, middleware, route mounts
│   │   ├── server.js               ← HTTP server entry point (starts on PORT)
│   │   ├── lib/
│   │   │   └── prisma.js           ← Singleton PrismaClient (pg adapter)
│   │   ├── middleware/
│   │   │   ├── authenticate.js     ← JWT verification middleware (protected routes)
│   │   │   └── errorHandler.js     ← Global error handler (Zod, Prisma, JWT errors)
│   │   └── routes/
│   │       ├── auth.js             ← /api/auth/*  (register, login, refresh, logout, me)
│   │       ├── user.js             ← /api/me      (profile read/update, password change)
│   │       ├── companies.js        ← /api/companies (list + /slugs lightweight)
│   │       ├── company.js          ← /api/company/:slug (problems + stats)
│   │       ├── questions.js        ← /api/questions/:slug (single problem detail)
│   │       ├── search.js           ← /api/search (questions + topics + companies)
│   │       ├── topics.js           ← /api/topics (list + detail by slug)
│   │       ├── stats.js            ← /api/stats (platform-wide numbers)
│   │       ├── progress.js         ← /api/progress (track, bulk, notes)
│   │       ├── bookmarks.js        ← /api/bookmarks (toggle, list)
│   │       └── dashboard.js        ← /api/dashboard (user summary stats)
│   ├── prisma/
│   │   ├── schema.prisma           ← Database schema (6 models)
│   │   └── migrations/             ← Auto-generated migration files
│   ├── scripts/
│   │   ├── import-data.js          ← CSV → DB importer (runs once)
│   │   └── setup-db.sh             ← DB setup shell script
│   ├── tests/
│   │   └── routes/
│   │       ├── auth.test.js        ← Auth route integration tests (jest + supertest)
│   │       └── public.test.js      ← Public route integration tests
│   ├── DSA_API_Collection.postman_collection.json
│   ├── package.json
│   ├── .env.example
│   └── prisma.config.ts
│
├── docs/
│   ├── backend/
│   │   ├── api-reference.md        ← Complete API endpoint documentation
│   │   ├── architecture.md         ← System design + data flow
│   │   ├── setup.md                ← Dev environment setup guide
│   │   ├── pending.md              ← Remaining tasks tracker
│   │   ├── fixes-high-priority.md  ← High priority fix notes
│   │   └── fixes-medium-low-priority.md
│   └── product/
│       └── PRD.md                  ← Product Requirements Document
│
├── leetcode-company-wise-problems/ ← Raw data source (git submodule)
│   └── [471 company folders]/      ← Each has CSVs: All.csv, 30days.csv, etc.
│
├── BACKEND_REFERENCE.md
├── FEATURES_PLAN.md                ← Full feature roadmap
├── IMPLEMENTATION_PLAN_BACKEND.md
└── PRD_DSA_Platform.md
```

---

## ⚙️ Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | Latest LTS |
| Web Framework | Express | ^5.2.1 |
| Database | PostgreSQL | 15+ |
| ORM | Prisma | ^7.9.1 |
| DB Adapter | `@prisma/adapter-pg` | ^7.9.1 |
| Auth | `jsonwebtoken` + `bcryptjs` | ^9 / ^3 |
| Validation | Zod | ^4.4.3 |
| Security | Helmet, CORS, express-rate-limit | Latest |
| Logging | Morgan | ^1.11.0 |
| CSV Parsing | csv-parse | ^7.0.2 |
| Testing | Jest + Supertest | ^30 / ^7 |
| Dev Server | Nodemon | ^3.1.14 |

---

## 🗄️ Database Schema (Prisma)

### 6 Models Overview

```
Company ──< CompanyQuestion >── Question
                                   │
                               ┌───┴────┐
                           Progress  Bookmark
                               │        │
                             User ──< RefreshToken
```

### Model Details

#### `Company`
```prisma
id    Int    @id @default(autoincrement())
name  String @unique       // "Google"
slug  String @unique       // "google"
questions CompanyQuestion[]
```

#### `Question`
```prisma
id         Int      @id @default(autoincrement())
slug       String   @unique    // "two-sum"
title      String              // "Two Sum"
difficulty String             // "EASY" | "MEDIUM" | "HARD"
link       String             // LeetCode URL
topics     String[]            // ["Array", "Hash Table"]
companies  CompanyQuestion[]
progress   Progress[]
bookmarks  Bookmark[]
@@index([difficulty])
@@index([title])
```

#### `CompanyQuestion` ← join table with metadata
```prisma
companyId      Int
questionId     Int
period         String   // "30days" | "3months" | "6months" | "6plus" | "all"
frequency      Float    // how often asked (0–100)
acceptanceRate Float    // LeetCode acceptance %
@@id([companyId, questionId, period])
```

#### `User`
```prisma
id        String   @id @default(uuid())
email     String   @unique
name      String
password  String   // bcrypt hashed
avatar    String?  // URL or null
createdAt DateTime @default(now())
progress      Progress[]
bookmarks     Bookmark[]
refreshTokens RefreshToken[]
```

#### `Progress`
```prisma
userId     String
questionId Int
status     String    // "solved" | "attempted" | "not-started"
notes      String?   // personal notes
solvedAt   DateTime? // first solve timestamp (set once)
updatedAt  DateTime  @updatedAt
@@id([userId, questionId])
```

#### `Bookmark`
```prisma
userId     String
questionId Int
createdAt  DateTime @default(now())
@@id([userId, questionId])
```

#### `RefreshToken`
```prisma
id        Int      @id @default(autoincrement())
token     String   @unique
userId    String
createdAt DateTime @default(now())
@@index([userId])
```

---

## 🚦 Route Map & All Endpoints

### Rate Limits
| Route Group | Limit |
|---|---|
| `/api/auth/*` | 10 req / 15 min / IP |
| All other `/api/*` | 100 req / 1 min / IP |

---

### 🌍 Public Routes (no auth needed)

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Server health check |
| GET | `/api/stats` | Platform-wide stats (companies, questions, topics, users) |
| GET | `/api/companies` | All companies with `questionCount` + `topTopics` |
| GET | `/api/companies/slugs` | Lightweight list: `[{ name, slug }]` — for navigation |
| GET | `/api/company/:slug` | Paginated problem list for one company (see filters below) |
| GET | `/api/company/:slug/stats` | Difficulty + topic breakdown per time period |
| GET | `/api/questions/:slug` | Full detail of one question (companies + topics) |
| GET | `/api/search` | Search questions, topics, companies |
| GET | `/api/topics` | All topics sorted by problem count |
| GET | `/api/topics/:topic` | Problems for a specific topic (slug-based) |

#### `GET /api/company/:slug` — Query Params
| Param | Values | Default |
|---|---|---|
| `period` | `30days \| 3months \| 6months \| 6plus \| all` | `all` |
| `difficulty` | `EASY,MEDIUM,HARD` (comma-separated) | — |
| `topics` | `Array,Dynamic Programming` (comma-separated) | — |
| `sortBy` | `frequency \| acceptanceRate \| difficulty \| title` | `frequency` |
| `page` | integer | `1` |
| `limit` | integer (max 200) | `50` |

> **Auth-aware:** When `Authorization` header is present, each problem includes `status` and `bookmarked` fields. This uses **optional auth** — the route works for both anonymous and logged-in users.

#### `GET /api/search` — Query Params
| Param | Description |
|---|---|
| `q` | Search term (min 2 chars, required) |
| `type` | `questions \| topics \| companies \| all` (default: `all`) |
| `difficulty` | `EASY \| MEDIUM \| HARD` (only for question search) |
| `limit` | Max 100, default 20 |

---

### 🔐 Auth Routes (`/api/auth/*`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Create account, returns `token` + `refreshToken` |
| POST | `/api/auth/login` | None | Login, returns `token` + `refreshToken` |
| POST | `/api/auth/refresh` | None | Get new access token using `refreshToken` |
| POST | `/api/auth/logout` | ✅ Required | Revoke refresh token (server-side logout) |
| GET | `/api/auth/me` | ✅ Required | Get current user profile |

**Token Details:**
- **Access Token:** 7-day JWT, signed with `JWT_SECRET`
- **Refresh Token:** 30-day JWT, signed with `JWT_REFRESH_SECRET`, stored in DB

**Register/Login Request Body:**
```json
{ "email": "user@gmail.com", "name": "Ravi", "password": "mypass123" }
```

**Token Response:**
```json
{
  "success": true,
  "token": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "id": "uuid", "name": "Ravi", "email": "user@gmail.com" }
}
```

---

### 🔒 Protected Routes (require `Authorization: Bearer <token>`)

| Method | Path | Description |
|---|---|---|
| GET | `/api/me` | Get user profile |
| PUT | `/api/me` | Update name / avatar |
| PUT | `/api/me/password` | Change password (requires current password) |
| GET | `/api/dashboard` | Full user stats in one call |
| GET | `/api/progress` | Paginated progress list (filter by `status`, `page`, `limit`) |
| POST | `/api/progress` | Upsert progress for one question |
| PATCH | `/api/progress/:questionId/notes` | Update only notes (no status change) |
| POST | `/api/progress/bulk` | Fetch statuses for up to 500 question IDs |
| GET | `/api/bookmarks` | Paginated bookmarks |
| POST | `/api/bookmarks` | Toggle bookmark on/off (idempotent) |

**`PUT /api/me` Body:**
```json
{ "name": "New Name", "avatar": "https://..." }
```

**`PUT /api/me/password` Body:**
```json
{ "currentPassword": "old123", "newPassword": "new456" }
```
> Note: Changing password **revokes all refresh tokens** → forces re-login everywhere.

**`POST /api/progress` Body:**
```json
{ "questionId": 3, "status": "solved", "notes": "Used hash map approach" }
```

**`POST /api/progress/bulk` Body:**
```json
{ "questionIds": [3, 7, 15, 22] }
```

**`GET /api/dashboard` Response:**
```json
{
  "overview":       { "totalSolved": 42, "totalAttempted": 17, "totalBookmarks": 8, "totalQuestions": 3257 },
  "difficulty":     { "easy": 15, "medium": 22, "hard": 5 },
  "topCompanies":   [{ "name": "Google", "slug": "google", "solvedCount": 12 }],
  "topTopics":      [{ "name": "Dynamic Programming", "solvedCount": 9 }],
  "recentActivity": [{ "questionId": 3, "slug": "two-sum", "title": "Two Sum", "status": "solved", "updatedAt": "..." }]
}
```

---

## 🛡️ Middleware

### `authenticate.js` — JWT Verification
```
Header required: Authorization: Bearer <accessToken>
```
- Extracts token from `Authorization` header
- Verifies with `JWT_SECRET`
- Attaches decoded payload to `req.user` (`{ id, email }`)
- Used on all protected routes (auth, user, progress, bookmarks, dashboard)

### `errorHandler.js` — Global Error Handler
Catches and formats 4 error types:

| Error | HTTP Status | When |
|---|---|---|
| `ZodError` | 400 | Input validation fails (schema.parse()) |
| `P2002` (Prisma) | 409 | Unique constraint violation |
| `P2003` (Prisma) | 400 | Foreign key constraint fail |
| `P2025` (Prisma) | 404 | Record not found |
| `JsonWebTokenError` | 401 | Invalid JWT |
| `TokenExpiredError` | 401 | Expired JWT |
| Generic | 500 | Anything else |

All errors use consistent response shape:
```json
{ "success": false, "error": "Human message", "code": "ERROR_CODE" }
```

---

## 🔧 Environment Variables (`.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Access token signing secret |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token signing secret |
| `PORT` | Optional | Server port (default: 5000) |
| `NODE_ENV` | Optional | `development` \| `production` |
| `CORS_ORIGIN` | ✅ | Frontend URL (e.g., `http://localhost:5173`) |

---

## 📊 Data Source

The `leetcode-company-wise-problems/` directory (git submodule) contains **471 company folders**, each with multiple CSV files:

```
Google/
├── All.csv       ← period = "all"
├── 30days.csv    ← period = "30days"
├── 3months.csv   ← period = "3months"
├── 6months.csv   ← period = "6months"
└── 6plus.csv     ← period = "6plus"
```

Each CSV row: `Question Title, Acceptance, Frequency, LeetCode Link, Difficulty, Topics`

The `scripts/import-data.js` script reads all CSVs and populates the DB via Prisma.

**Platform Scale:**
- 471 companies
- ~3,257 unique questions
- ~74 distinct DSA topics
- 5 time periods per company

---

## 🧪 Testing

| File | What it covers |
|---|---|
| `tests/routes/auth.test.js` | Register, login, refresh, logout, /me endpoints |
| `tests/routes/public.test.js` | Stats, companies, company detail, search, topics |

```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
```

---

## 📜 NPM Scripts

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `nodemon src/server.js` | Dev server with hot reload |
| `npm start` | `node src/server.js` | Production start |
| `npm run import` | `node scripts/import-data.js` | Import CSV data to DB |
| `npm run studio` | `npx prisma studio` | Prisma GUI browser |
| `npm test` | `jest --runInBand --forceExit` | Run integration tests |

---

## ✅ Backend Feature Status

| Feature | Status | Notes |
|---|---|---|
| Register / Login | ✅ Done | Zod validation, bcrypt hashing |
| JWT Access Token (7d) | ✅ Done | Signed with `JWT_SECRET` |
| Refresh Token (30d) | ✅ Done | DB-stored, rotatable |
| Server-side logout | ✅ Done | Deletes refresh token from DB |
| Profile read | ✅ Done | `GET /api/me` |
| Profile update | ✅ Done | `PUT /api/me` (name + avatar) |
| Password change | ✅ Done | `PUT /api/me/password` |
| Rate limiting | ✅ Done | Auth: 10/15min, API: 100/min |
| Zod input validation | ✅ Done | All write routes |
| Prisma error mapping | ✅ Done | P2002, P2003, P2025, P2000 |
| Morgan logging | ✅ Done | dev/combined based on NODE_ENV |
| Company list | ✅ Done | Full + lightweight `/slugs` |
| Company problems | ✅ Done | Paginated + filtered + sorted |
| Company stats | ✅ Done | Per-period difficulty breakdown |
| Question detail | ✅ Done | `GET /api/questions/:slug` |
| Search | ✅ Done | Questions + topics + companies |
| Topics list + detail | ✅ Done | Slug-case-insensitive resolution |
| Platform stats | ✅ Done | `GET /api/stats` |
| Progress tracking | ✅ Done | Upsert + bulk + notes + solvedAt |
| Bookmarks | ✅ Done | Toggle (idempotent) + paginated list |
| Dashboard | ✅ Done | All stats in parallel queries |
| Auth-enriched company page | ✅ Done | `status` + `bookmarked` per problem |
| Integration tests | ✅ Done | Jest + Supertest |

---

## 🖥️ Frontend Integration Guide

> **What the frontend will be:** React + Vite SPA (likely at `http://localhost:5173`)  
> **CORS is configured to allow:** `CORS_ORIGIN` from `.env`

### Auth Flow
```
1. POST /api/auth/login → store { token, refreshToken } in localStorage
2. Every API request: add header "Authorization: Bearer <token>"
3. On 401 → POST /api/auth/refresh with { refreshToken } → get new token
4. On logout → POST /api/auth/logout with { refreshToken } → clear localStorage
```

### Key Pages & Their API Calls

| Page | API Calls |
|---|---|
| Landing/Home | `GET /api/stats` |
| Company List | `GET /api/companies` or `/slugs` |
| Company Detail | `GET /api/company/:slug?period=&difficulty=&sortBy=&page=` |
| Question Detail | `GET /api/questions/:slug` |
| Search | `GET /api/search?q=&type=&difficulty=` |
| Topics | `GET /api/topics` → `GET /api/topics/:slug` |
| Dashboard | `GET /api/dashboard` (authenticated) |
| Progress | `GET /api/progress` + `POST /api/progress` |
| Bookmarks | `GET /api/bookmarks` + `POST /api/bookmarks` |
| Profile | `GET /api/me` + `PUT /api/me` + `PUT /api/me/password` |

### Standard Pagination Response Shape
All paginated endpoints follow this pattern:
```json
{
  "success": true,
  "pagination": { "page": 1, "limit": 50, "total": 443, "totalPages": 9 },
  "data": [...]
}
```

### Standard Error Shape
```json
{ "success": false, "error": "Human readable message", "code": "ERROR_CODE" }
```

### Common Error Codes
| Code | Meaning |
|---|---|
| `EMAIL_EXISTS` | 409 — Email already registered |
| `INVALID_CREDENTIALS` | 401 — Wrong email/password |
| `VALIDATION_ERROR` | 400 — Zod validation failed (includes `issues` array) |
| `COMPANY_NOT_FOUND` | 404 — Invalid company slug |
| `NOT_FOUND` | 404 — Resource doesn't exist |
| `WRONG_PASSWORD` | 401 — Current password incorrect |
| `SAME_PASSWORD` | 400 — New password same as old |
| `REVOKED_REFRESH_TOKEN` | 401 — Refresh token already logged out |

---

## 🔮 What's NOT Built Yet (Frontend Scope)

The entire **React frontend** has not been created yet. Here's what needs to be built:

| Frontend Feature | Priority |
|---|---|
| Landing page (stats, company search) | High |
| Company list page (cards, search) | High |
| Company detail page (problem table, filters, period tabs) | High |
| Authentication pages (login, register) | High |
| Dashboard page (charts, progress overview) | High |
| Search results page | Medium |
| Topics page | Medium |
| Question detail modal/page | Medium |
| User profile page | Medium |
| Bookmarks page | Low |
| Progress history page | Low |
