# 🗺️ Complete Features Plan

## DSA Interview Prep Platform

**Status:** ✅ Final Tech Stack Decided
**Last Updated:** July 29, 2026

---

## ✅ Final Tech Stack

| Layer                   | Technology           | Details                                     |
| ----------------------- | -------------------- | ------------------------------------------- |
| **Frontend**      | React.js + Vite      | React Router v6, Vanilla CSS, Lucide icons  |
| **Backend**       | Node.js + Express    | REST API, Prisma ORM, JWT Auth              |
| **ORM**           | Prisma               | Type-safe queries, schema migrations        |
| **Database**      | PostgreSQL           | Local → Aiven (production)                 |
| **Auth**          | JWT + bcrypt         | Email/password login (Google OAuth Phase 2) |
| **Dev DB**        | PostgreSQL localhost | `localhost:5432/dsa_db`                   |
| **Prod DB**       | Aiven PostgreSQL     | Free tier, change only`.env` to switch    |
| **Backend Host**  | Railway              | Free tier                                   |
| **Frontend Host** | Vercel               | Free tier, auto-deploy from GitHub          |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   React.js Frontend                     │
│            (Vercel CDN — globally fast)                 │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP / REST API
┌──────────────────────▼──────────────────────────────────┐
│           Node.js + Express Backend                     │
│                 Prisma ORM                              │
│            (Railway — always on)                        │
└──────────────────────┬──────────────────────────────────┘
                       │ SQL queries
┌──────────────────────▼──────────────────────────────────┐
│              PostgreSQL Database                        │
│    Dev: localhost:5432   →   Prod: Aiven                │
│   (Change 1 line in .env to switch — zero code change)  │
└─────────────────────────────────────────────────────────┘
```

---

## Why This Stack

| Decision                 | Reason                                                             |
| ------------------------ | ------------------------------------------------------------------ |
| **React**          | Component-based, fast, huge ecosystem                              |
| **Express**        | Lightweight, flexible, industry standard                           |
| **Prisma**         | Type-safe ORM, auto migrations, great DX                           |
| **PostgreSQL**     | Native array support for`topics[]`, complex joins, battle-tested |
| **Aiven**          | Free managed PostgreSQL, standard connection string                |
| **Local → Aiven** | Develop offline locally, deploy with one`.env` change            |

---

## Overview — Build Order

```
Phase 0 → Database: Schema + CSV Import    ← START HERE
Phase 1 → Backend: Express + Prisma API
Phase 2 → Frontend: Foundation & Setup
Phase 3 → Frontend: Landing Page
Phase 4 → Frontend: Company Browser
Phase 5 → Frontend: Company Detail (Core)
Phase 6 → Frontend: Interactivity Layer
Phase 7 → Frontend: Discovery Features
Phase 8 → Polish & Deploy
```

---

## Phase 0 — Database: Schema + CSV Import 🗄️

> **Goal:** Set up PostgreSQL locally, define the Prisma schema, and run the one-time CSV import script to populate the database. After this, CSVs are never touched again.

**Stack:** PostgreSQL · Prisma ORM · csv-parse (import script only)

**Folder:**

**Project Structure:**

```
project-dsa/
  backend/
    prisma/
      schema.prisma        ← DB schema definition
      migrations/          ← auto-generated migration files
    scripts/
      import-data.js       ← ONE-TIME: reads CSVs → inserts to PostgreSQL
    src/
      routes/              ← companies, questions, search, topics, auth, progress
      middleware/          ← errorHandler, auth, rateLimiter, validator
      utils/               ← slugify, formatters
      app.js
      server.js
    .env                   ← DATABASE_URL=postgresql://localhost:5432/dsa_db
  frontend/
    src/
      ...
  data/
    leetcode-company-wise-problems/  ← source CSVs (import script reads these)
```

---

### P0-01 · PostgreSQL Local Setup

```bash
# Install PostgreSQL
sudo apt install postgresql

# Create DB
sudo -u postgres psql
CREATE DATABASE dsa_db;
CREATE USER dsa_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE dsa_db TO dsa_user;
```

**`.env`:**

```env
DATABASE_URL="postgresql://dsa_user:password@localhost:5432/dsa_db"
```

**Acceptance Criteria:**

- [ ] PostgreSQL running locally
- [ ] `dsa_db` database created
- [ ] `.env` configured

---

### P0-02 · Prisma Schema

**File:** `backend/prisma/schema.prisma`

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
  difficulty String            // EASY | MEDIUM | HARD
  link       String
  topics     String[]          // PostgreSQL native array
  companies  CompanyQuestion[]
  progress   Progress[]
  bookmarks  Bookmark[]

  @@index([difficulty])
  @@index([title])
}

model CompanyQuestion {
  company        Company  @relation(fields: [companyId], references: [id])
  companyId      Int
  question       Question @relation(fields: [questionId], references: [id])
  questionId     Int
  period         String   // "30days" | "3months" | "6months" | "6plus" | "all"
  frequency      Float
  acceptanceRate Float

  @@id([companyId, questionId, period])
  @@index([companyId, period])
}

model User {
  id        String     @id @default(uuid())
  email     String     @unique
  name      String
  avatar    String?
  password  String     // hashed with bcrypt
  createdAt DateTime   @default(now())
  progress  Progress[]
  bookmarks Bookmark[]
}

model Progress {
  user       User     @relation(fields: [userId], references: [id])
  userId     String
  question   Question @relation(fields: [questionId], references: [id])
  questionId Int
  status     String   // "solved" | "attempted" | "not-started"
  updatedAt  DateTime @updatedAt

  @@id([userId, questionId])
}

model Bookmark {
  user       User     @relation(fields: [userId], references: [id])
  userId     String
  question   Question @relation(fields: [questionId], references: [id])
  questionId Int
  createdAt  DateTime @default(now())

  @@id([userId, questionId])
}
```

```bash
npx prisma generate    # generate Prisma client
npx prisma db push     # create tables in local PostgreSQL
npx prisma studio      # open visual browser at localhost:5555
```

**Acceptance Criteria:**

- [ ] All 6 tables created in local DB
- [ ] `npx prisma studio` opens and shows empty tables

---

### P0-03 · CSV Import Script (Run Once)

**File:** `backend/scripts/import-data.js`

**What it does:**

1. Reads all 471 company folders
2. Parses all 5 CSV files per company
3. Normalizes data (acceptanceRate ×100, topics → array)
4. Inserts into PostgreSQL via Prisma
5. Uses `upsert` — safe to re-run

```bash
node scripts/import-data.js
# Logs: Importing Google... (174 rows) ✅
# Logs: Importing Amazon... (210 rows) ✅
# ... 471 companies
# Done in ~45 seconds
```

**After this script:** CSVs are never needed again. All data lives in PostgreSQL.

**Acceptance Criteria:**

- [ ] All 471 companies imported
- [ ] All 5 periods imported per company
- [ ] `acceptanceRate` stored as percentage (57.8 not 0.578)
- [ ] `topics` stored as PostgreSQL array
- [ ] Re-running script does not duplicate data (upsert)
- [ ] Check in Prisma Studio — tables have data

---

### P0-04 · Switch to Aiven (Production)

When ready to deploy:

1. Create free account at **aiven.io**
2. Create a free PostgreSQL service
3. Copy connection string from Aiven dashboard
4. Update **only** `.env.production`:

```env
# .env.production
DATABASE_URL="postgresql://user:pass@aiven-host.aivencloud.com:PORT/dsa_db?sslmode=require"
```

5. Run `npx prisma db push` against Aiven
6. Run `node scripts/import-data.js` against Aiven (one time)

**Zero code changes. Only `.env` changes.**

**Acceptance Criteria:**

- [ ] Aiven DB has all tables and data
- [ ] Backend deployed on Railway connects to Aiven successfully

---

## Phase 1 — Backend: Node.js + Express + Prisma API 🖥️

> **Goal:** Build the REST API that queries PostgreSQL via Prisma and serves data to the React frontend.

**Stack:** Node.js · Express · Prisma Client · JWT · bcrypt · express-rate-limit · helmet

---

### B-00 · Normalized API Response — Problem Object

Every endpoint returns problems in this shape:

```json
{
  "id": 1,
  "slug": "two-sum",
  "title": "Two Sum",
  "difficulty": "EASY",
  "frequency": 100.0,
  "acceptanceRate": 57.8,
  "link": "https://leetcode.com/problems/two-sum",
  "topics": ["Array", "Hash Table"]
}
```

---

### B-01 · GET `/api/companies`

Returns list of all 471 companies with metadata.

```json
{ "total": 471, "companies": [{ "name": "Google", "slug": "google", "questionCount": 174, "periods": ["30days","all"] }] }
```

- Built from scanning DATA_ROOT at startup, cached permanently.

**Acceptance Criteria:**

- [ ] Returns all 471 companies
- [ ] `questionCount` from `5. All.csv` row count
- [ ] `periods` lists only CSV files that actually exist

---

### B-02 · GET `/api/company/:name`

Returns problems for one company + time period.

**Query params:** `period` · `difficulty` · `topics` · `sortBy` · `order` · `page` · `limit`

**Period values:** `30days` · `3months` · `6months` · `6plus` · `all` (default)

**Response:**

```json
{ "company": "Google", "period": "30days", "pagination": { "page": 1, "total": 80 }, "problems": [...] }
```

**Acceptance Criteria:**

- [ ] Reads correct CSV based on `period` param
- [ ] Difficulty + topics filters apply server-side
- [ ] Results paginated (default 50, max 200)
- [ ] Results cached in LRU cache for 1 hour
- [ ] Returns 404 `COMPANY_NOT_FOUND` for unknown companies
- [ ] Returns 404 `PERIOD_NOT_AVAILABLE` if CSV doesn't exist

---

### B-03 · GET `/api/company/:name/stats`

Returns summary stats (no full problem list).

```json
{ "company": "Google", "stats": { "all": { "total": 174, "easy": 42, "medium": 98, "hard": 34, "avgAcceptance": 58.2, "topTopics": ["Array","DP"] } } }
```

**Acceptance Criteria:**

- [ ] Returns stats for all available periods
- [ ] `topTopics` = top 5 most frequent topic tags

---

### B-04 · GET `/api/search?q=...`

Searches problem titles across all companies.

**Strategy:** Build in-memory search index at startup (reads all `5. All.csv` files). ~10–30s startup, then instant.

**Response:**

```json
{ "query": "two sum", "results": [{ "title": "Two Sum", "difficulty": "EASY", "companies": [{ "name": "Google", "frequency": 100 }], "companyCount": 38 }] }
```

**Acceptance Criteria:**

- [ ] Search index built at startup
- [ ] Returns all companies that asked the problem, sorted by frequency
- [ ] Min 2 chars query enforced
- [ ] Rate limited to 60 req/15min

---

### B-05 · GET `/api/topics`

All unique DSA topics with problem + company counts.

```json
{ "topics": [{ "name": "Array", "problemCount": 4821, "companyCount": 380 }] }
```

Built from search index at startup, cached permanently.

---

### B-06 · GET `/api/topics/:topic`

All problems tagged with a specific topic, across all companies.

**Query params:** `difficulty` · `sortBy` · `page` · `limit`

**Acceptance Criteria:**

- [ ] Returns paginated problem list for the topic
- [ ] Each problem includes list of companies that asked it

---

### B-07 · GET `/api/stats`

Global platform statistics for landing page.

```json
{ "stats": { "totalCompanies": 471, "totalUniqueProblems": 3842, "totalTopics": 43, "lastUpdated": "2025-06-01" } }
```

---

### B-08 · Middleware

| Middleware            | Purpose                                                                |
| --------------------- | ---------------------------------------------------------------------- |
| `errorHandler.js`   | Global catch-all; returns`{ success, error, code, statusCode }`      |
| `rateLimiter.js`    | 200 req/15min global; 60 req/15min for`/api/search`                  |
| `validator.js`      | Validates`period`, `difficulty`, `page`, `limit`, `q` params |
| `logger.js`         | Logs method + path + status + duration per request                     |
| `helmet` + `cors` | Security headers; allow frontend origin                                |

---

### B-09 · Startup Sequence

```
1. Load .env
2. Scan DATA_ROOT → build company index (instant)
3. Read all 471 × All.csv → build search + topic + stats index (~10–30s)
4. Start Express on PORT 5000 ✅
```

All subsequent requests served from cache in <10ms.

**Backend Build Order (8 days):**

```
Day 1: Setup + csvService + normalizer + /health
Day 2-3: /api/companies + /api/company/:name (no filters)
Day 4: Filters + pagination + cacheService
Day 5-6: indexService + /api/search + /api/topics + /api/stats
Day 7: Middleware (rate limit, validation, logger, helmet)
Day 8: Deploy to Railway/Render
```

---

## Phase 1 — Frontend: Project Foundation 🏗️

---

### F-10 · Project Setup

**Tech:** Vite + React + React Router v6

> ⚠️ Frontend now calls the backend API — NOT a local JSON file. Replace any `DataContext` JSON fetch with `fetch('http://localhost:5000/api/...')`.

**Folder structure:**

```
frontend/
  public/
    data/
      questions.json      ← generated
      topics.json         ← generated
  src/
    components/
      layout/
        Navbar.jsx
        Footer.jsx
      ui/
        DifficultyBadge.jsx
        TopicChip.jsx
        FrequencyBar.jsx
        ProgressRing.jsx
        SearchInput.jsx
        Spinner.jsx
    pages/
      Landing.jsx
      Companies.jsx
      CompanyDetail.jsx
      Search.jsx
      Topics.jsx
      Bookmarks.jsx
      Dashboard.jsx
    context/
      ProgressContext.jsx  ← localStorage r/w
      BookmarkContext.jsx  ← localStorage r/w
    hooks/
      useCompanyData.js    ← fetches from /api/company/:name
      useCompanies.js      ← fetches from /api/companies
      useSearch.js         ← fetches from /api/search
      useFilter.js         ← client-side filter state
      useProgress.js
      useBookmarks.js
    api/
      companies.js         ← API call wrappers
      company.js
      search.js
      topics.js
    utils/
      formatters.js
    App.jsx
    index.css
    main.jsx
```

**Acceptance Criteria:**

- [ ] Vite dev server starts with `npm run dev`
- [ ] React Router configured with all 7 routes
- [ ] `api/` layer configured with backend base URL from `.env`
- [ ] Dark theme applied globally via CSS variables
- [ ] `.env`: `VITE_API_URL=http://localhost:5000`

---

### F-11 · Global Design System (CSS)

**File:** `src/index.css`

**Design tokens:**

```css
:root {
  /* Colors */
  --bg-primary:    #0d1117;
  --bg-secondary:  #161b22;
  --bg-card:       #1c2128;
  --border:        #30363d;
  --text-primary:  #e6edf3;
  --text-muted:    #7d8590;
  --accent:        #58a6ff;

  /* Difficulty */
  --easy:    #00b8a3;
  --medium:  #ffa116;
  --hard:    #ef4743;

  /* Status */
  --solved:    #3fb950;
  --attempted: #d29922;
  --unsolved:  #30363d;

  /* Spacing & Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
}
```

**Components styled:**

- `.badge` — difficulty badge
- `.chip` — topic chip
- `.card` — company/problem card
- `.btn` `.btn-primary` `.btn-ghost`
- `.progress-bar`
- `.tab` `.tab-active`
- `.table` `.table-row`
- `.input` `.search-input`

**Acceptance Criteria:**

- [ ] All colors use CSS variables (no hardcoded hex in components)
- [ ] Dark mode renders correctly
- [ ] Typography uses `Inter` from Google Fonts

---

### F-12 · Navbar Component

**File:** `src/components/layout/Navbar.jsx`

**Elements:**

- Logo / Brand name (left)
- Nav links: Home · Companies · Topics · Search (center/right)
- Progress indicator: "🔥 42 solved" (right) — pulled from ProgressContext
- Mobile hamburger menu (responsive)

**Acceptance Criteria:**

- [ ] Active route is highlighted
- [ ] Progress count updates live
- [ ] Sticky/fixed on scroll

---

## Phase 2 — Landing Page 🚀

---

### F-20 · Hero Section

**File:** `src/pages/Landing.jsx`

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Ace Your Tech Interview                           │
│   Browse 471+ companies' real LeetCode questions    │
│   filtered by recency, difficulty & topic.          │
│                                                     │
│   [ 🔍 Search a company... ]   [ Browse All → ]    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**

- [ ] Company search in hero navigates to `/companies?q=...`
- [ ] CTA button navigates to `/companies`
- [ ] Hero has animated gradient or particle background

---

### F-21 · Stats Bar

**Below hero — live stats from `GET /api/stats`:**

| Companies | Questions | Topics | Updated   |
| --------- | --------- | ------ | --------- |
| 471+      | 50,000+   | 40+    | June 2025 |

**Acceptance Criteria:**

- [ ] Numbers animate (count-up) on page load
- [ ] Data fetched from `GET /api/stats` on mount

---

### F-22 · Featured Companies Grid

**12 featured companies** (FAANG + top Indian):

Row 1: Google, Meta, Amazon, Apple, Microsoft, Netflix
Row 2: Flipkart, Paytm, Swiggy, Zomato, Infosys, Wipro

Each card shows:

- Company name
- Question count (from `all.csv`)
- Top 3 topics
- Hover → subtle glow + "View Problems →"

**Acceptance Criteria:**

- [ ] Clicking a card navigates to `/company/:name`
- [ ] Hover animations smooth (CSS transition)
- [ ] Question counts are real from the data

---

### F-23 · How It Works Section

**3-step visual:**

```
1. Pick a Company  →  2. Choose Time Period  →  3. Filter & Solve
```

**Acceptance Criteria:**

- [ ] Simple, clean illustration or icon per step
- [ ] CTA at bottom: "Start Preparing →"

---

## Phase 3 — Frontend: Company Browser 🏢

---

### F-30 · Company Grid / List

**File:** `src/pages/Companies.jsx`

**Data:** `GET /api/companies` on mount.

**Default view:** Responsive grid of 471+ company cards

Each card:

```
┌────────────────────────┐
│  Google                │
│  174 problems          │
│  [Array] [DP] [Graph]  │
│  ████░░░░  12 solved   │
└────────────────────────┘
```

**Acceptance Criteria:**

- [ ] All 471 companies rendered from API response
- [ ] Card shows `questionCount` from API
- [ ] Progress bar shows user's solved count (from localStorage)
- [ ] Grid is responsive (3 cols desktop, 2 tablet, 1 mobile)
- [ ] Loading skeleton shown while API fetches

---

### F-31 · Company Search & Filter Bar

**Controls:**

- 🔍 Text search: instant filter by company name
- Sort dropdown: `A–Z` | `Z–A` | `Most Questions` | `My Progress`

**Acceptance Criteria:**

- [ ] Search is instant (no debounce needed — client-side)
- [ ] URL updates: `/companies?q=google`
- [ ] Empty state: "No companies found for 'xyz'"

---

### F-32 · Alphabet Quick-Nav

**A–Z letter bar** at top of company list — click 'G' jumps to Google section.

**Acceptance Criteria:**

- [ ] Letters scroll page to first company starting with that letter
- [ ] Active letter highlights as user scrolls

---

## Phase 4 — Frontend: Company Detail Page ⭐ (Core)

---

### F-40 · Page Header

**File:** `src/pages/CompanyDetail.jsx`

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│  ← Back    Google                    174 problems total  │
│            [Array] [DP] [Graph] [BFS] ...               │
│            ████████░░  42 / 174 solved  (24%)           │
└──────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**

- [ ] Company name from URL param
- [ ] Top topics shown as chips (top 5 from `all.csv`)
- [ ] Progress bar reflects localStorage solved count

---

### F-41 · Time Period Tabs

**Data:** Each tab switch triggers `GET /api/company/:name?period=<tab>`.

**5 tabs — switches the active question list:**

```
[ 30 Days ]  [ 3 Months ]  [ 6 Months ]  [ 6+ Months ]  [ All Time ✓ ]
```

- Active tab persists to URL param: `?period=30days`
- Each tab shows a count badge: `30 Days (52)`

**Acceptance Criteria:**

- [ ] Tab switch triggers new API call (with loading state)
- [ ] URL updates on tab switch (shareable links)
- [ ] Default tab is "All Time"
- [ ] Tab counts from `GET /api/company/:name/stats`
- [ ] Previously fetched tab data cached client-side (no re-fetch)

---

### F-42 · Filter Sidebar / Bar

**Controls (always visible above table):**

| Filter     | Type                  | Options                                                                                 |
| ---------- | --------------------- | --------------------------------------------------------------------------------------- |
| Difficulty | Multi-checkbox        | Easy / Medium / Hard                                                                    |
| Topics     | Multi-select dropdown | All topics in this company                                                              |
| Status     | Multi-checkbox        | Not Started / Attempted / Solved                                                        |
| Sort By    | Dropdown              | Frequency ↓, Frequency ↑, Acceptance ↓, Difficulty Easy→Hard, Difficulty Hard→Easy |

**Active filter chips** shown below the bar (click to remove):

```
[× Easy]  [× Array]  [× Solved]
```

**Acceptance Criteria:**

- [ ] Filters apply instantly (no submit button)
- [ ] Filter state persists when switching time period tabs
- [ ] "Clear All Filters" button resets everything
- [ ] Active filter count shown: "3 filters active"
- [ ] URL reflects filters (shareable)

---

### F-43 · Question Table

**The main content — virtualized for performance.**

**Columns:**

| # | Title   | Difficulty | Frequency    | Acceptance | Topics         | Status    | Link |
| - | ------- | ---------- | ------------ | ---------- | -------------- | --------- | ---- |
| 1 | Two Sum | 🟢 Easy    | ████ 100 | 57.8%      | [Array] [Hash] | ✅ Solved | ↗   |

**Row interactions:**

- Click status pill → cycle through `Not Started → Attempted → Solved`
- Hover row → subtle highlight + bookmark star appears
- Click title → navigate to LeetCode (new tab)
- Click bookmark star → toggle bookmark

**Column details:**

**Difficulty Badge (`DifficultyBadge.jsx`):**

```
🟢 Easy    → green pill
🟡 Medium  → amber pill
🔴 Hard    → red pill
```

**Frequency Bar (`FrequencyBar.jsx`):**

```
[████████░░] 80.0
```

- Bar width = `(frequency / 100) * 100%`

**Status Pill:**

```
⬜ Not Started  → click → 🟡 Attempted  → click → ✅ Solved → click → ⬜
```

**Topic Chips (`TopicChip.jsx`):**

```
[Array]  [Hash Table]  [+2 more]
```

- Show first 2, rest collapsed with "+N more" badge
- Click a chip → adds it to Topic filter

**Acceptance Criteria:**

- [ ] Table renders 500+ rows smoothly (virtualized with react-window or TanStack)
- [ ] Status change persists immediately to localStorage
- [ ] Frequency bar width is proportional
- [ ] Acceptance rate formatted to 1 decimal place
- [ ] "+N more" topics expand on click
- [ ] LeetCode link opens in new tab

---

### F-44 · Table Pagination / Infinite Scroll

- Show 50 rows by default
- "Load More" button or infinite scroll for rest
- OR full virtual scrolling (preferred)

**Acceptance Criteria:**

- [ ] Initial render < 200ms even for 500+ row tables
- [ ] Smooth scroll throughout

---

### F-45 · Company Stats Summary Card

**Right sidebar or top card (desktop):**

```
┌────────────────────────────┐
│ 📊 Quick Stats             │
│ Easy:   42  (24%)          │
│ Medium: 98  (56%)          │
│ Hard:   34  (20%)          │
│                            │
│ Top Topics:                │
│ Array • DP • Graph         │
│                            │
│ Avg Acceptance: 58.2%      │
└────────────────────────────┘
```

**Acceptance Criteria:**

- [ ] Stats computed from currently active time period tab
- [ ] Mini donut chart for difficulty distribution

---

## Phase 5 — Interactivity Layer 💾

---

### F-50 · Progress Tracking (localStorage)

**Context:** `src/context/ProgressContext.jsx`

**localStorage key:** `dsa_progress`

**Schema:**

```json
{
  "two-sum": "solved",
  "trapping-rain-water": "attempted",
  "3sum": "not-started"
}
```

**Keyed by problem `id` (slug from title)**

**Hooks:** `useProgress()`

```js
const { getStatus, setStatus, getSolvedCount } = useProgress();
```

**Acceptance Criteria:**

- [ ] Status persists on page refresh
- [ ] Changing status in Company Detail reflects in Company Browser card
- [ ] `getSolvedCount(companyName, period)` returns correct count
- [ ] Global total solved count available

---

### F-51 · Bookmarks (localStorage)

**Context:** `src/context/BookmarkContext.jsx`

**localStorage key:** `dsa_bookmarks`

**Schema:**

```json
["two-sum", "merge-intervals", "lru-cache"]
```

**Hooks:** `useBookmarks()`

```js
const { isBookmarked, toggleBookmark, bookmarks } = useBookmarks();
```

**Acceptance Criteria:**

- [ ] Bookmark star visible on table row hover
- [ ] Toggling is instant
- [ ] Bookmarked problems accessible at `/bookmarks`

---

### F-52 · Bookmarks Page

**File:** `src/pages/Bookmarks.jsx`

**Layout:**

- Same question table as Company Detail
- Groups by company: "Google (3) · Amazon (2) · Meta (1)"
- Filter: by company, difficulty, status
- Empty state: "No bookmarks yet. Star problems to save them."

**Acceptance Criteria:**

- [ ] Shows all bookmarked problems across all companies
- [ ] Status can be updated from this page
- [ ] Remove bookmark from this page

---

### F-53 · My Progress Dashboard

**File:** `src/pages/Dashboard.jsx`

**Sections:**

#### Overall Stats

```
┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
│ 142  │  │  87  │  │  31  │  │  24  │
│Total │  │Solved│  │Att'd │  │Hard  │
│Solved│  │Easy  │  │      │  │Solved│
└──────┘  └──────┘  └──────┘  └──────┘
```

#### Progress by Company (Top 10)

```
Google     ████████░░  42/174  (24%)
Amazon     ██████░░░░  31/210  (15%)
Meta       ████░░░░░░  18/130  (14%)
```

#### Topic Coverage

```
Array          ██████████ 80%
Hash Table     ████████░░ 65%
Dynamic Prog   █████░░░░░ 40%
```

#### Recent Activity

```
✅ Solved "Two Sum" (Google) — 2 hours ago
🟡 Attempted "Merge Intervals" (Amazon) — yesterday
```

**Acceptance Criteria:**

- [ ] All stats computed from localStorage
- [ ] Company progress list sortable by progress %
- [ ] Recent activity shows last 10 status changes (with timestamps)

---

## Phase 6 — Frontend: Discovery Features 🔍

---

### F-60 · Global Problem Search

**File:** `src/pages/Search.jsx`

**Search behavior:**

- Text input (debounced 300ms) → calls `GET /api/search?q=...`
- Backend does the heavy lifting (in-memory index)
- Matches on problem title (substring)

**Result card:**

```
┌─────────────────────────────────────────────┐
│  Two Sum                      🟢 Easy       │
│  [Array] [Hash Table]                       │
│                                             │
│  Asked by 38 companies:                     │
│  Google (100%) · Amazon (95%) · Meta (88%) │
│                                             │
│  [Mark Solved]  [Bookmark]  [↗ LeetCode]   │
└─────────────────────────────────────────────┘
```

**Acceptance Criteria:**

- [ ] Search results appear as user types (no button press)
- [ ] Shows every company that asked this problem + their frequency
- [ ] Companies sorted by frequency descending
- [ ] Status and bookmark actions work from search results
- [ ] URL: `/search?q=two+sum` (shareable)

---

### F-61 · Topic Explorer

**File:** `src/pages/Topics.jsx`

**Layout:**

**Topic Cards Grid:**

```
┌─────────────────┐  ┌─────────────────┐
│  📦 Array       │  │  🌲 Trees       │
│  4,821 problems │  │  2,104 problems │
│  380 companies  │  │  290 companies  │
└─────────────────┘  └─────────────────┘
```

**Topic Detail (on click — modal or sub-page):**

- Shows all problems with that topic tag, across all companies
- Filterable by difficulty
- Sortable by frequency
- Shows which companies asked each problem

**Acceptance Criteria:**

- [ ] All unique topics from the dataset shown
- [ ] Each topic card shows problem count + company count
- [ ] Clicking a topic shows problems in that topic
- [ ] Problems in topic view can be marked solved/bookmarked

---

### F-62 · Company Comparison (Bonus)

**Compare 2 companies side by side:**

- `/compare?a=Google&b=Amazon`
- Shows: overlapping problems, unique problems per company, difficulty distribution

**Acceptance Criteria:**

- [ ] Select 2 companies via dropdowns
- [ ] Show Venn diagram of shared problems
- [ ] Table of shared problems with both companies' frequency

---

## Phase 7 — Frontend: Polish & Deployment ✨

---

### F-70 · Animations & Micro-interactions

| Element            | Animation                                |
| ------------------ | ---------------------------------------- |
| Company cards      | Fade-in on scroll (IntersectionObserver) |
| Hero stats         | Count-up numbers on page load            |
| Tab switch         | Slide transition                         |
| Filter toggle      | Smooth height expand/collapse            |
| Status pill change | Brief pulse/scale animation              |
| Progress bars      | Animate width on mount                   |
| Page transitions   | Fade between routes                      |

---

### F-71 · Responsive Design

| Breakpoint           | Changes                                  |
| -------------------- | ---------------------------------------- |
| Desktop (>1200px)    | Full sidebar filters, 3-col company grid |
| Tablet (768–1200px) | Filters collapse to top bar, 2-col grid  |
| Mobile (<768px)      | Single column, bottom filter sheet       |

**Acceptance Criteria:**

- [ ] All pages usable on 375px wide mobile
- [ ] Table scrolls horizontally on mobile
- [ ] Navbar collapses to hamburger on mobile

---

### F-72 · Performance Optimization

- [ ] `questions.json` lazy-loaded on first needed route
- [ ] Company data chunked: load one company at a time
- [ ] Table virtualized (react-window)
- [ ] Images: company logos lazy-loaded
- [ ] Lighthouse score: Performance > 90, Accessibility > 90

---

### F-73 · SEO

**Each page:**

- Unique `<title>` tag
- Meta description
- Open Graph tags (for sharing on social)

**Examples:**

```
/ → "DSA Interview Prep | Company-Wise LeetCode Questions"
/company/google → "Google Interview Questions | 174 LeetCode Problems"
/topics → "Browse DSA Topics | Arrays, DP, Trees & More"
```

---

### F-74 · Deployment

**Backend:** Railway or Render (free tier, persistent server)
**Frontend:** Vercel

**Steps:**

1. Push backend to GitHub → deploy on Railway
2. Set `DATA_ROOT`, `PORT`, `CORS_ORIGIN` env vars on Railway
3. Update frontend `.env.production`: `VITE_API_URL=https://your-backend.railway.app`
4. Push frontend → Vercel auto-deploys

**Acceptance Criteria:**

- [ ] Backend live on Railway with `/health` returning 200
- [ ] Frontend deployed on Vercel calling live backend URL
- [ ] CORS configured for production frontend domain
- [ ] HTTPS enabled on both
- [ ] First startup index build completes without timeout

---

## Complete Feature Summary Table

| ID   | Feature                      | Phase | Priority    | Effort |
| ---- | ---------------------------- | ----- | ----------- | ------ |
| B-00 | Normalized Problem Object    | 0     | 🔴 Critical | Small  |
| B-01 | GET /api/companies           | 0     | 🔴 Critical | Small  |
| B-02 | GET /api/company/:name       | 0     | 🔴 Critical | Large  |
| B-03 | GET /api/company/:name/stats | 0     | 🟡 High     | Small  |
| B-04 | GET /api/search              | 0     | 🟡 High     | Medium |
| B-05 | GET /api/topics              | 0     | 🟡 High     | Small  |
| B-06 | GET /api/topics/:topic       | 0     | 🟡 High     | Small  |
| B-07 | GET /api/stats               | 0     | 🔴 Critical | Small  |
| B-08 | Middleware stack             | 0     | 🔴 Critical | Medium |
| F-10 | Project Setup                | 1     | 🔴 Critical | Small  |
| F-11 | Design System CSS            | 1     | 🔴 Critical | Medium |
| F-12 | Navbar                       | 1     | 🔴 Critical | Small  |
| F-20 | Hero Section                 | 2     | 🟡 High     | Small  |
| F-21 | Stats Bar                    | 2     | 🟡 High     | Small  |
| F-22 | Featured Companies           | 2     | 🟡 High     | Small  |
| F-23 | How It Works                 | 2     | 🟢 Medium   | Small  |
| F-30 | Company Grid                 | 3     | 🔴 Critical | Medium |
| F-31 | Company Search/Filter        | 3     | 🔴 Critical | Small  |
| F-32 | Alphabet Quick-Nav           | 3     | 🟢 Medium   | Small  |
| F-40 | Company Page Header          | 4     | 🔴 Critical | Small  |
| F-41 | Time Period Tabs             | 4     | 🔴 Critical | Small  |
| F-42 | Filter Bar                   | 4     | 🔴 Critical | Medium |
| F-43 | Question Table               | 4     | 🔴 Critical | Large  |
| F-44 | Virtualization               | 4     | 🟡 High     | Medium |
| F-45 | Stats Summary Card           | 4     | 🟡 High     | Small  |
| F-50 | Progress Tracking            | 5     | 🔴 Critical | Medium |
| F-51 | Bookmarks                    | 5     | 🟡 High     | Small  |
| F-52 | Bookmarks Page               | 5     | 🟡 High     | Small  |
| F-53 | Progress Dashboard           | 5     | 🟡 High     | Medium |
| F-60 | Global Search                | 6     | 🟡 High     | Medium |
| F-61 | Topic Explorer               | 6     | 🟡 High     | Medium |
| F-62 | Company Comparison           | 6     | 🟢 Medium   | Large  |
| F-70 | Animations                   | 7     | 🟡 High     | Medium |
| F-71 | Responsive Design            | 7     | 🔴 Critical | Medium |
| F-72 | Performance                  | 7     | 🟡 High     | Medium |
| F-73 | SEO                          | 7     | 🟡 High     | Small  |
| F-74 | Deployment                   | 7     | 🔴 Critical | Small  |

---

## Build Order (Week by Week)

### Week 1 — Backend Foundation

```
B-00 → B-01 → B-02 (no filters) → B-07 → B-08 (basic)
```

**Deliverable:** Backend running, can list companies & fetch any company's problems.

### Week 2 — Backend: Filters + Search + Deploy

```
B-02 (filters+pagination) → B-03 → B-04 → B-05 → B-06 → B-08 (full) → Deploy Railway
```

**Deliverable:** Full backend live. All API endpoints tested.

### Week 3 — Frontend: Foundation + Landing + Company Browser

```
F-10 → F-11 → F-12 → F-20 → F-21 → F-22 → F-23 → F-30 → F-31
```

**Deliverable:** Frontend connects to live API. Landing page + company browser working.

### Week 4 — Frontend: Company Detail (Core)

```
F-40 → F-41 → F-42 → F-43 → F-44 → F-45
```

**Deliverable:** Full company detail page with 5 tabs, filters, and question table.

### Week 5 — Frontend: Interactivity + Discovery

```
F-50 → F-51 → F-52 → F-53 → F-60 → F-61
```

**Deliverable:** Progress tracking, bookmarks, dashboard, global search, topic explorer.

### Week 6 — Polish & Deploy

```
F-70 → F-71 → F-72 → F-73 → F-74
```

**Deliverable:** Animations, responsive, SEO done. Both backend + frontend live in production.
