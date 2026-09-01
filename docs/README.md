# 📚 DSA Prep Platform — Documentation Hub

Welcome to the centralized documentation portal for **DSA Prep Platform**. Here you will find architectural overviews, API references, product specifications, frontend guides, setup instructions, and deployment workflows.

---

## 🧭 Documentation Map

```text
docs/
├── README.md                      ← Master documentation portal (You are here)
│
├── 🎨 frontend/                   ← Frontend architecture, state management & UI guides
│   ├── architecture.md            ← React 19 + Vite 5 SPA structure, tokens & patterns
│   ├── navbar.md                  ← Navbar search, authentication, responsive drawer & logout flow
│   ├── tanstack-query.md          ← TanStack Query caching strategy, query keys & mutations
│   ├── app-routing.md             ← App.jsx routes, code-splitting & lazy loading
│   ├── prd.md                     ← Frontend Product Requirements Document
│   └── upgrade-guide.md           ← UI/UX & performance upgrade changelog
│
├── ⚙️ backend/                    ← Backend system design, API contracts & database
│   ├── architecture.md            ← Express 5 + Prisma 7 architecture & DB schema
│   ├── EMAIL_OTP_AUTHENTICATION_GUIDE.md ← Complete Email OTP Verification & Security Guide
│   ├── api-reference.md           ← Complete REST API endpoint reference with JSON payloads
│   ├── setup.md                   ← Local backend & PostgreSQL setup guide
│   ├── pending.md                 ← Prioritized backend backlog & roadmap
│   ├── fixes-high-priority.md     ← High-priority bug fixes & resolutions
│   └── fixes-medium-low-priority.md ← Security & robustness hardening tasks
│
├── 📦 product/                    ← High-level requirements, roadmap & classifications
│   ├── PRD.md                     ← Core Product Requirements Document (what & why)
│   ├── codebase-overview.md       ← Full-stack codebase walkthrough & component mapping
│   └── features-plan.md           ← Feature breakdown, phase breakdown & future plans
│
├── 🧪 testing/                    ← QA, API validation & automated testing
│   └── postman.md                 ← Postman collection setup & API testing guide
│
├── 💾 data/                       ← Company classification & curation datasets
│   ├── product_based.txt          ← Product-based company classifications
│   └── service based.txt          ← Service-based company classifications
│
└── 🗄️ archive/                    ← Historical implementation plans & changelogs
    ├── frontend-bugs-fixed.md     ← Resolved frontend issues log
    ├── frontend-bugs-and-issues.md← Historical bug triage
    ├── backend-implementation-plan.md ← Initial backend implementation roadmap
    ├── frontend-implementation-plan.md ← Initial frontend implementation roadmap
    ├── database-upgrade-plan.md   ← Database migration & optimization log
    └── backend-reference-legacy.md← Legacy backend specifications
```

---

## ⚡ Quick Navigation

### 1. 🏗 Architecture & System Design

- [**Email OTP & Security Architecture**](./backend/EMAIL_OTP_AUTHENTICATION_GUIDE.md) — CSPRNG, SHA-256 hashing, brute-force protection & Nodemailer transport.
- [**Frontend Architecture**](./frontend/architecture.md) — Directory layout, components, context, design system.
- [**Navbar Component Guide**](./frontend/navbar.md) — Quick search, authentication controls, mobile drawer, and logout flow.
- [**TanStack Query Strategy**](./frontend/tanstack-query.md) — Stale-time rules, cache keys, optimistic mutations.
- [**Route Management**](./frontend/app-routing.md) — Dynamic imports, suspense fallbacks, protected routes.
- [**Backend Architecture**](./backend/architecture.md) — Express middleware, Prisma models, PostgreSQL relations.

### 2. 📡 API & Database Reference

- [**REST API Reference**](./backend/api-reference.md) — Authentication, Companies, Topics, Questions, Progress, Bookmarks.
- [**Local Development Setup**](./backend/setup.md) — PostgreSQL configuration, Prisma migrations, environment setup.
- [**Postman Testing Guide**](./testing/postman.md) — Environment variables, request collections, test scripts.

### 3. 🎯 Product & Planning

- [**Product Requirements Document (PRD)**](./product/PRD.md) — Target personas, tier classifications, feature specifications.
- [**Codebase Overview**](./product/codebase-overview.md) — High-level file-by-file walkthrough.
- [**Features & Milestone Plan**](./product/features-plan.md) — Completed milestones and upcoming roadmap.

---

## 📊 Tech Stack Summary

| Layer | Technology | Key Libraries |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite 5, JavaScript (ESNext) | TanStack Query v5, React Router v7, Framer Motion, Lucide React |
| **Backend** | Node.js 20+, Express 5 | Prisma ORM 7, PostgreSQL 17, JWT, bcryptjs |
| **Styling** | Vanilla CSS3 (Custom Design System) | Glassmorphism, CSS Variables, Responsive Grid/Flex |
| **Auth** | Dual Token System | 7-day JWT access token + 30-day DB refresh token + Google OAuth 2.0 |
| **Hosting** | Vercel (Frontend), Render (Backend/DB) | Supabase/Neon/Render PostgreSQL compatibility |

---

## 🛠️ Local Quickstart

### Prerequisites

- **Node.js**: `v20.0.0+`
- **PostgreSQL**: `15+` (Local or cloud connection string)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env     # Configure DATABASE_URL and JWT_SECRET
npx prisma migrate dev
npm run dev              # Runs Express API on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev              # Runs Vite dev server on http://localhost:5173
```
