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

## 7. Core Features

### 7.1 Homepage / Landing Page
- Hero section: tagline + company search + CTA
- Stats bar: total companies, questions, topics — live from `GET /api/stats`
- Featured companies grid (FAANG + top Indian companies)
- How It Works — 3-step visual

### 7.2 Company Browser  `/companies`
- Grid of all 471+ companies
- Instant search by company name
- Sort: A–Z, Most Questions, My Progress
- Each card: company name, question count, top topics, progress bar

### 7.3 Company Detail Page ⭐ `/company/:name`

#### Time Period Tabs
| Tab | DB Period Value |
|---|---|
| Last 30 Days | `30days` |
| Last 3 Months | `3months` |
| Last 6 Months | `6months` |
| 6+ Months Ago | `6plus` |
| All Time | `all` |

#### Question Table Columns
| Column | Description |
|---|---|
| Title | Problem name (clickable → LeetCode) |
| Difficulty | EASY / MEDIUM / HARD — color-coded |
| Frequency | Visual bar (0–100) |
| Acceptance % | Formatted to 1 decimal |
| Topics | Pill/chip tags |
| Status | Not Started / Attempted / Solved |
| Bookmark | Star icon |

### 7.4 User Auth  `/login` · `/register`
- Register with email + password
- JWT stored in localStorage
- Progress and bookmarks tied to account — synced across devices

### 7.5 Progress Tracking
- Mark: `Not Started → Attempted → Solved`
- Stored in DB — available on any device after login
- Progress bar per company

### 7.6 Bookmarks
- Star any question; `/bookmarks` page shows all saved questions

### 7.7 Global Search  `/search?q=...`
- Search problem titles across all 471+ companies

### 7.8 Topic Explorer  `/topics`
- All unique DSA topics; click to see problems tagged with it

### 7.9 My Progress Dashboard  `/dashboard`
- Total solved, by difficulty, top companies, topic coverage, recent activity

---

## 8. API Summary

See [`../backend/api-reference.md`](../backend/api-reference.md) for full details.

| Method | Endpoint | Auth |
|---|---|---|
| GET | `/api/companies` | Public |
| GET | `/api/company/:slug` | Public + auth-aware |
| GET | `/api/company/:slug/stats` | Public |
| GET | `/api/search` | Public |
| GET | `/api/topics` | Public |
| GET | `/api/topics/:topic` | Public |
| GET | `/api/stats` | Public |
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/me` | 🔐 JWT |
| GET | `/api/dashboard` | 🔐 JWT |
| GET/POST | `/api/progress` | 🔐 JWT |
| POST | `/api/progress/bulk` | 🔐 JWT |
| GET/POST | `/api/bookmarks` | 🔐 JWT |

---

## 9. Pages & Routes

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

## 10. UI/UX Principles

- **Dark mode first** — developers prefer dark themes
- Color-coded difficulty: 🟢 Easy `#00b8a3` · 🟡 Medium `#ffa116` · 🔴 Hard `#ef4743`
- Frequency shown as a visual progress bar
- Topics as pill/chip badges
- Skeleton loading states on all API-dependent views
- Smooth hover animations and micro-interactions

---

## 11. MVP Scope

### ✅ Phase 1 (Backend Complete)
- [x] PostgreSQL schema + CSV import script
- [x] All backend API endpoints (17 routes)
- [x] User registration + login (JWT)

### 🔜 Phase 1 (Frontend In Progress)
- [ ] Landing page
- [ ] Company browser
- [ ] Company detail (5 tabs, filters, question table)
- [ ] Auth pages
- [ ] Dashboard
- [ ] Global search + Topic explorer
- [ ] Deploy: Railway + Aiven + Vercel

### Phase 2 (Future)
- Google OAuth login
- Problem notes / annotations
- AI study plan generator
- Company hiring trend insights
- Mobile app

---

## 12. Development Timeline

| Week | Tasks |
|---|---|
| **Week 1** | PostgreSQL local setup + Prisma schema + CSV import |
| **Week 2** | Express backend + all API endpoints + Auth ✅ Done |
| **Week 3** | React setup + Landing page + Company Browser |
| **Week 4** | Company Detail page (5 tabs, filters, question table) |
| **Week 5** | Progress, Bookmarks, Search, Topics, Dashboard |
| **Week 6** | Polish + responsive + SEO + Deploy |

---

## 13. Open Questions — All Resolved

| # | Question | Decision |
|---|---|---|
| 1 | Static site or backend API? | ✅ **Backend** — 280MB of data can't be static |
| 2 | Which database? | ✅ **PostgreSQL** — native arrays, joins |
| 3 | ORM or raw SQL? | ✅ **Prisma** — type-safe, migrations, great DX |
| 4 | DB hosting? | ✅ **Aiven** (prod) · localhost (dev) |
| 5 | Auth in MVP? | ✅ **Yes** — JWT + bcrypt from day 1 |
| 6 | Progress stored where? | ✅ **Database** — synced across devices |
