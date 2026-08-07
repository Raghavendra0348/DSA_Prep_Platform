
# 📋 Product Requirements Document

## DSA Interview Prep Platform — LeetCode Company-Wise Questions

**Version:** 2.0
**Date:** July 29, 2026
**Status:** ✅ Final — Tech Stack Decided

---

## 1. Executive Summary

A full-stack web platform that lets software engineering candidates browse, filter, and study **company-specific LeetCode DSA questions** — organized by recency (30 days, 3 months, 6 months, all-time) — with rich filtering, progress tracking, user accounts, and a premium study experience.

**Data source:** `leetcode-company-wise-problems` — 471+ company folders, CSV files per company containing: `Difficulty`, `Title`, `Frequency`, `Acceptance Rate`, `Link`, `Topics`.

---

## 2. Problem Statement

> DSA interview prep is fragmented. Candidates don't know which problems to prioritize for a specific target company. Raw CSV files on GitHub are not user-friendly and lack filtering, bookmarking, progress tracking, or user accounts.

**Users need:**
- A single place to see every company's recent asked questions
- Ability to filter by difficulty, topic, and recency (time period)
- A way to track their progress problem by problem — synced across devices
- Quick access to the LeetCode link for each problem

---

## 3. Target Users

| Persona | Description |
|---|---|
| **Job Seeker** | Actively interviewing; wants to target specific companies (e.g., Google, Amazon) |
| **Student** | Preparing for campus placements; needs structured preparation |
| **Career Switcher** | Preparing for FAANG; needs to prioritize high-frequency problems |

---

## 4. Goals & Success Metrics

| Goal | Metric |
|---|---|
| Enable company-specific prep | User can browse any of 471+ companies |
| Reduce time-to-find | Finding questions < 5 seconds via search/filter |
| Improve retention | Users return 3+ sessions per week |
| Track progress | % of questions marked as solved per company, synced across devices |
| User accounts | Users can register, login, and sync progress anywhere |

---

## 5. ✅ Final Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React.js + Vite | React Router v6, Vanilla CSS, Lucide icons |
| **Backend** | Node.js + Express | REST API, Prisma ORM, JWT Auth |
| **ORM** | Prisma | Type-safe queries, schema migrations |
| **Database** | PostgreSQL | Local → Aiven (production) |
| **Auth** | JWT + bcrypt | Email/password, Google OAuth (Phase 2) |
| **Dev DB** | PostgreSQL localhost | `localhost:5432/dsa_db` |
| **Prod DB** | Aiven PostgreSQL | Free tier, one `.env` change to switch |
| **Backend Host** | Railway | Free tier, always-on |
| **Frontend Host** | Vercel | Free tier, auto-deploy from GitHub |

---

## 6. System Architecture

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

## 7. Database Schema

```
companies          → 471 companies
questions          → ~3,800 unique problems
company_questions  → company × question × period (frequency, acceptance)
users              → registered accounts
progress           → user × question status (solved/attempted)
bookmarks          → user × question
```

**Key design:** CSV data is imported **once** into PostgreSQL via a script. After import, CSVs are never read again. All queries go through Prisma → PostgreSQL.

---

## 8. Core Features

### 8.1 Homepage / Landing Page
- Hero section: tagline + company search + CTA
- Stats bar: total companies, questions, topics — live from `GET /api/stats`
- Featured companies grid (FAANG + top Indian companies)
- How It Works — 3-step visual

---

### 8.2 Company Browser
**Route:** `/companies`

- Grid of all 471+ companies — loaded from `GET /api/companies`
- Instant search by company name
- Sort: A–Z, Most Questions, My Progress
- Each card shows: company name, question count, top topics, progress bar
- Virtualized grid (react-window) — renders only visible cards
- Skeleton loading state while API responds

---

### 8.3 Company Detail Page ⭐ (Core)
**Route:** `/company/:companyName`

#### Time Period Tabs
| Tab | DB Period Value | Source CSV |
|---|---|---|
| Last 30 Days | `30days` | `1. Thirty Days.csv` |
| Last 3 Months | `3months` | `2. Three Months.csv` |
| Last 6 Months | `6months` | `3. Six Months.csv` |
| 6+ Months Ago | `6plus` | `4. More Than Six Months.csv` |
| All Time | `all` | `5. All.csv` |

- Tab switch → `GET /api/company/:name?period=<tab>`
- Previously loaded tabs cached client-side (no re-fetch)
- Tab counts from `GET /api/company/:name/stats`

#### Question Table Columns
| Column | Description |
|---|---|
| # | Row number |
| Title | Problem name (clickable → LeetCode, new tab) |
| Difficulty | EASY / MEDIUM / HARD — color-coded badge |
| Frequency | Visual bar (0–100) |
| Acceptance % | Formatted to 1 decimal |
| Topics | Pill/chip tags (first 2 shown, +N more) |
| Status | Not Started / Attempted / Solved — click to cycle |
| Bookmark | Star icon on hover |

#### Filters
- Difficulty: Easy / Medium / Hard (multi-select)
- Topics: multi-select dropdown
- Status: Not Started / Attempted / Solved
- Sort by: Frequency ↓ (default), Acceptance Rate, Difficulty

---

### 8.4 User Auth
**Routes:** `/login` · `/register`

- Register with email + password
- Login → receives JWT token stored in localStorage
- JWT sent as `Authorization: Bearer <token>` on all authenticated requests
- Progress and bookmarks tied to user account — synced across devices

---

### 8.5 Progress Tracking (Cloud-Synced)
- Mark each question: `Not Started → Attempted → Solved`
- Stored in DB `progress` table — available on any device after login
- Progress bar per company: "42 / 174 solved (24%)"
- Dashboard: total solved, by difficulty, by topic, recent activity

---

### 8.6 Bookmarks
- Star any question
- `/bookmarks` page shows all saved questions grouped by company
- Stored in DB `bookmarks` table — synced across devices

---

### 8.7 Global Problem Search
**Route:** `/search?q=...`

- Search problem titles across all 471+ companies
- Backend: `GET /api/search?q=two+sum`
- Results show: problem title, difficulty, topics, and all companies that asked it + their frequency

---

### 8.8 Topic Explorer
**Route:** `/topics`

- All unique DSA topics from the dataset
- Each topic card: problem count + company count
- Click topic → see all problems tagged with it, across all companies

---

### 8.9 My Progress Dashboard
**Route:** `/dashboard`

- Overall stats: total solved, by difficulty
- Progress by company (top 10)
- Topic coverage
- Recent activity (last 10 status changes)

---

## 9. API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/companies` | No | List all 471 companies |
| GET | `/api/company/:name` | No | Problems for one company + period + filters |
| GET | `/api/company/:name/stats` | No | Stats summary (no problem list) |
| GET | `/api/search?q=...` | No | Search problems across all companies |
| GET | `/api/topics` | No | All DSA topics with counts |
| GET | `/api/topics/:topic` | No | Problems by topic |
| GET | `/api/stats` | No | Global platform stats |
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login → returns JWT |
| GET | `/api/me` | ✅ JWT | Get current user |
| POST | `/api/progress` | ✅ JWT | Update problem status |
| GET | `/api/progress` | ✅ JWT | Get all user progress |
| POST | `/api/bookmarks` | ✅ JWT | Add/remove bookmark |
| GET | `/api/bookmarks` | ✅ JWT | Get all bookmarks |
| GET | `/health` | No | Server health check |

---

## 10. Pages & Routes

| Route | Page | Auth Required |
|---|---|---|
| `/` | Landing | No |
| `/companies` | Company Browser | No |
| `/company/:name` | Company Detail | No (progress requires login) |
| `/search` | Global Search | No |
| `/topics` | Topic Explorer | No |
| `/topics/:name` | Topic Detail | No |
| `/bookmarks` | Bookmarks | ✅ Yes |
| `/dashboard` | My Progress | ✅ Yes |
| `/login` | Login | No |
| `/register` | Register | No |

---

## 11. UI/UX Principles

- **Dark mode first** — developers prefer dark themes
- Color-coded difficulty:
  - 🟢 **Easy** — `#00b8a3`
  - 🟡 **Medium** — `#ffa116`
  - 🔴 **Hard** — `#ef4743`
- Frequency shown as a visual progress bar (not just a number)
- Topics as pill/chip badges
- Skeleton loading states on all API-dependent views
- Virtualized table and grid (react-window) for performance
- Client-side tab caching (no re-fetch on tab revisit)
- Smooth hover animations and micro-interactions

---

## 12. MVP Scope

### ✅ Phase 1 — MVP (6 Weeks)
- [ ] PostgreSQL schema + CSV import script
- [ ] All backend API endpoints
- [ ] User registration + login (JWT)
- [ ] Landing page
- [ ] Company browser (search, sort, grid)
- [ ] Company detail (5 tabs, filters, question table)
- [ ] Progress tracking (cloud-synced via DB)
- [ ] Bookmarks (cloud-synced via DB)
- [ ] Global search
- [ ] Topic explorer
- [ ] Progress dashboard
- [ ] Deploy: Railway (backend) + Aiven (DB) + Vercel (frontend)

### ❌ Out of Scope (Phase 2)
- Google OAuth login
- Problem notes / annotations
- Community features (comments, upvotes)
- AI study plan generator
- Company hiring trend insights
- Mobile app
- Data auto-update pipeline

---

## 13. Phase 2 Enhancements

| Feature | Description |
|---|---|
| **Google OAuth** | Login with Google account |
| **Smart Study Plan** | AI-generated 30/60/90-day plan for a target company |
| **Problem Notes** | Add personal notes to each question |
| **Company Insights** | Hiring difficulty ratings, trends |
| **Data Auto-Update** | Cron job to refresh CSV data monthly |
| **Company Comparison** | Compare 2 companies side by side |
| **Roadmaps** | Curated topic-wise learning paths |

---

## 14. Open Questions — Resolved

| # | Question | Decision |
|---|---|---|
| 1 | Static site or backend API? | ✅ **Backend** — 280MB of data can't be static |
| 2 | Which database? | ✅ **PostgreSQL** — native arrays, joins, battle-tested |
| 3 | ORM or raw SQL? | ✅ **Prisma** — type-safe, migrations, great DX |
| 4 | DB hosting? | ✅ **Aiven** (prod) · localhost (dev) |
| 5 | Auth in MVP? | ✅ **Yes** — JWT + bcrypt from day 1 |
| 6 | Progress stored where? | ✅ **Database** — synced across devices |
| 7 | Cold start / loading issues? | ✅ **Solved** — DB-backed, no startup index, always-on Railway |

---

## 15. Development Timeline

| Week | Tasks |
|---|---|
| **Week 1** | PostgreSQL local setup + Prisma schema + CSV import script |
| **Week 2** | Express backend + all API endpoints + Auth (JWT) |
| **Week 3** | React setup + Landing page + Company Browser |
| **Week 4** | Company Detail page (5 tabs, filters, question table) |
| **Week 5** | Progress, Bookmarks, Search, Topics, Dashboard |
| **Week 6** | Polish, animations, responsive, SEO + Deploy to Railway/Aiven/Vercel |
