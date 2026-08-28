<div align="center">

<img src="docs/images/dsa_logo.jpg" alt="DSA Prep Platform Logo" width="100" style="border-radius: 50%;" />

# 🚀 DSA Prep Platform

**Company-Wise LeetCode Interview Preparation — Built for Engineers, by Engineers**

Practice real LeetCode questions asked at **429+ top tech companies**, organized by recency,
difficulty, and tier classification to fast-track your interview prep.

[![Node.js](https://img.shields.io/badge/Node.js-≥20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-ISC-blue)](#license)

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [API Overview](#-api-overview)
- [Database Schema](#-database-schema)
- [Authentication Flow](#-authentication-flow)
- [Frontend Pages](#-frontend-pages)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Documentation](#-documentation)
- [License](#-license)

---

## ✨ Features

### 🏢 Company-Wise Question Browser
- **429+ companies** with questions sourced from real LeetCode interview data
- **4-Tier classification**: FAANG+ (Tier 1), Product Unicorns (Tier 2), High-Growth Startups (Tier 3), Service & IT (Tier 4)
- **Product vs. Service** company type filtering
- **Recency periods**: 30 Days, 3 Months, 6 Months, 6+ Months, All Time
- **Sort by** frequency, acceptance rate, difficulty, or title

### 📚 Structured DSA Learning Roadmap
- **10-phase learning curriculum** from fundamentals to advanced graph/DP algorithms
- Topics organized with learning rules and progression guidelines
- Per-topic problem listings with difficulty breakdowns

### 📊 Personal Analytics Dashboard
- **LeetCode-style radial gauge** with Easy/Medium/Hard breakdown
- **Top companies & topics** solved leaderboards
- **Recent activity feed** showing latest progress
- Animated count-up stats and completion tracking

### 🔍 Global Search & Command Palette
- **Full-text search** across questions, topics, and companies
- **Keyboard shortcut** `Ctrl+K` / `Cmd+K` to open command palette from anywhere
- Debounced real-time results with keyboard navigation

### 📝 Progress Tracking & Notes
- **3-state status toggle**: Not Started → Attempted → Solved
- **Personal notes** per question for approaches, complexity analysis, and revision
- **Bookmark system** to save problems for later review
- **Optimistic UI updates** — instant feedback with background server sync

### 🔐 Secure Authentication
- **JWT access tokens** (7-day expiry) + **database-backed refresh tokens** (30-day expiry)
- **Silent token refresh** via Axios interceptors — zero user disruption
- **Server-side logout** with refresh token revocation
- **Rate limiting** on auth endpoints (10 attempts / 15 min per IP)
- Password hashing with bcrypt (salt rounds = 10)

### 🎨 Modern Design System
- **Dark glassmorphism** aesthetic with glowing borders and micro-animations
- **Fully responsive** — desktop, tablet, and mobile
- **Framer Motion** page transitions and interactive animations
- **Accessibility**: skip-to-content links, keyboard navigation, semantic HTML

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│                                                                  │
│  React 19 + Vite 5 SPA                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ React Router │  │ TanStack     │  │ AuthContext            │  │
│  │ v7 (Lazy)   │  │ Query Cache  │  │ (JWT + localStorage)   │  │
│  └─────────────┘  └──────────────┘  └────────────────────────┘  │
│          │                │                     │                │
│          └────────┬───────┘                     │                │
│                   ▼                             │                │
│  ┌──────────────────────────────────────────────┘                │
│  │  Axios Client (Bearer header injection + 401 auto-refresh)   │
│  └──────────────────────────────┬───────────────────────────────┘│
└─────────────────────────────────┼────────────────────────────────┘
                                  │  HTTPS / REST JSON
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                        SERVER (Express 5)                        │
│                                                                  │
│  ┌────────┐  ┌────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │ Helmet │  │ CORS   │  │ Morgan   │  │ Rate Limiter       │  │
│  │(SecHdr)│  │(Origin)│  │(HTTP Log)│  │(100/min + 10/15min)│  │
│  └────────┘  └────────┘  └──────────┘  └────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  Routes: auth, companies, company, questions, search,       ││
│  │          topics, stats, progress, bookmarks, dashboard,     ││
│  │          user, contact                                      ││
│  └────────────────────────────┬─────────────────────────────────┘│
│                               │  Prisma ORM (Type-safe queries)  │
└───────────────────────────────┼──────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                   DATABASE (PostgreSQL)                           │
│                                                                  │
│  Tables: Company, Question, CompanyQuestion, User,               │
│          Progress, Bookmark, RefreshToken                        │
│                                                                  │
│  Optimized with covering indexes for period+frequency sorting    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
| :--- | :--- |
| **React 19** | UI component tree & hooks |
| **Vite 5** | Dev server with HMR, Rollup production bundler |
| **React Router v7** | Client-side routing with `React.lazy` code-splitting |
| **TanStack Query v5** | Server-state caching, background refetching, optimistic updates |
| **Axios** | HTTP client with interceptors for auth token management |
| **Framer Motion** | Page transitions & micro-animations |
| **Lucide React** | Modern SVG icon library |
| **Vanilla CSS** | Design tokens, glassmorphism, responsive flex/grid layouts |

### Backend
| Technology | Purpose |
| :--- | :--- |
| **Node.js ≥20** | Runtime |
| **Express 5** | HTTP framework |
| **Prisma 7** | Type-safe PostgreSQL ORM with migrations |
| **Zod 4** | Runtime request validation |
| **JSON Web Tokens** | Access + refresh token authentication |
| **bcryptjs** | Password hashing |
| **Helmet** | HTTP security headers |
| **express-rate-limit** | API & auth rate limiting |
| **Morgan** | Request logging |

### Database & Infrastructure
| Technology | Purpose |
| :--- | :--- |
| **PostgreSQL 17** | Relational database |
| **Prisma Migrate** | Schema migrations |
| **Vercel** | Frontend hosting (SPA) |
| **Render** | Backend API hosting |

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** ≥ 20.0.0
- **PostgreSQL** running locally (or a remote connection string)
- **npm** (comes with Node.js)

### 1. Clone the Repository

```bash
git clone https://github.com/Raghavendra0348/DSA_Prep_Platform.git
cd DSA_Prep_Platform
```

### 2. Install All Dependencies

```bash
# Install root, backend, and frontend dependencies
npm install
npm run install:all
```

### 3. Configure Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your PostgreSQL connection string and JWT secrets
```

> **Tip:** Generate JWT secrets with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 4. Set Up the Database

```bash
cd backend

# Run Prisma migrations to create tables
npx prisma migrate deploy

# Import company & question data
npm run import

# (Optional) Open Prisma Studio to explore the data
npm run studio
```

### 5. Start Development Servers

```bash
# From the project root — starts both backend and frontend concurrently
npm run dev
```

| Service | URL |
| :--- | :--- |
| Frontend (Vite) | http://localhost:5173 |
| Backend (Express) | http://localhost:5000 |
| Health Check | http://localhost:5000/health |

You can also start them individually:

```bash
npm run dev:backend    # Backend only (port 5000)
npm run dev:frontend   # Frontend only (port 5173)
```

---

## 📂 Project Structure

```
DSA_Prep_Platform/
├── backend/                        # Express.js API server
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema (7 models)
│   │   └── migrations/             # Prisma migration history
│   ├── src/
│   │   ├── server.js               # Entry point — starts Express
│   │   ├── app.js                  # App setup: middleware, routes, error handler
│   │   ├── middleware/
│   │   │   ├── authenticate.js     # JWT verification middleware
│   │   │   └── errorHandler.js     # Global error handler (Prisma, Zod, JWT errors)
│   │   ├── routes/
│   │   │   ├── auth.js             # Register, Login, Refresh, Logout, Me
│   │   │   ├── companies.js        # List all companies with stats
│   │   │   ├── company.js          # Company detail: paginated questions with filters
│   │   │   ├── questions.js        # Individual question lookup by slug
│   │   │   ├── search.js           # Full-text search (questions, topics, companies)
│   │   │   ├── topics.js           # Topic listing & topic detail with questions
│   │   │   ├── stats.js            # Platform-wide statistics
│   │   │   ├── progress.js         # User progress: CRUD + bulk fetch + notes
│   │   │   ├── bookmarks.js        # User bookmarks: list, add, remove
│   │   │   ├── dashboard.js        # Aggregated user analytics
│   │   │   ├── user.js             # Profile update & password change
│   │   │   └── contact.js          # Contact form submission
│   │   └── lib/
│   │       └── prisma.js           # Prisma client singleton
│   ├── scripts/
│   │   └── import-data.js          # CSV → PostgreSQL data import script
│   ├── tests/                      # Jest + Supertest API tests
│   ├── .env.example                # Environment variable template
│   └── package.json
│
├── frontend/                       # React 19 + Vite SPA
│   ├── src/
│   │   ├── main.jsx                # React entry: QueryClientProvider + App
│   │   ├── App.jsx                 # Root: Router, AuthProvider, Layout, Routes
│   │   ├── api/                    # API modules (one per resource)
│   │   │   ├── client.js           # Axios instance with interceptors
│   │   │   ├── auth.js             # Login, register, logout API calls
│   │   │   ├── companies.js        # Company list API
│   │   │   ├── company.js          # Company detail + stats API
│   │   │   ├── questions.js        # Question detail API
│   │   │   ├── search.js           # Search API
│   │   │   ├── topics.js           # Topics API
│   │   │   ├── progress.js         # Progress CRUD API
│   │   │   ├── bookmarks.js        # Bookmarks API
│   │   │   ├── dashboard.js        # Dashboard analytics API
│   │   │   ├── user.js             # Profile & password API
│   │   │   ├── stats.js            # Platform stats API
│   │   │   └── contact.js          # Contact form API
│   │   ├── hooks/                  # 20 custom React hooks
│   │   │   ├── useAuth.js          # AuthContext consumer
│   │   │   ├── useCompany.js       # Company detail + progress mutations
│   │   │   ├── useDashboard.js     # Dashboard data + refresh
│   │   │   ├── useBookmarks.js     # Bookmark list + filtering
│   │   │   ├── useSearch.js        # Search with debounce
│   │   │   ├── useTopics.js        # Topics listing
│   │   │   ├── useProfile.js       # Profile edit + password change
│   │   │   └── ...                 # useCountUp, useDebounce, useKeyboard, etc.
│   │   ├── components/
│   │   │   ├── layout/             # Navbar, Footer
│   │   │   ├── shared/             # ProtectedRoute, Pagination, FilterBar, etc.
│   │   │   └── ui/                 # 18+ reusable UI components
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Global auth state provider
│   │   ├── pages/                  # 16 page components (all lazy-loaded)
│   │   ├── data/                   # Static data: company classification, domains
│   │   └── styles/                 # CSS design tokens & resets
│   ├── index.html                  # SPA entry HTML
│   ├── vite.config.js              # Vite configuration
│   ├── vercel.json                 # Vercel SPA rewrite rules
│   └── package.json
│
├── docs/                           # Extended documentation
│   ├── product/PRD.md              # Product Requirements Document
│   ├── backend/                    # Architecture, API reference, setup guide
│   └── testing/postman.md          # Postman collection guide
│
├── leetcode-company-wise-problems/ # Raw source data (CSV)
├── dev.sh                          # Shell script to start both servers
├── package.json                    # Root: concurrently runs backend + frontend
└── README.md                       # ← You are here
```

---

## 🔌 API Overview

All endpoints are prefixed with `/api`. Protected endpoints require `Authorization: Bearer <token>`.

### Public Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/companies` | List all companies with question counts & difficulty stats |
| `GET` | `/api/company/:slug` | Paginated question list for a company (filters: period, difficulty, topics, sortBy) |
| `GET` | `/api/questions/:slug` | Single question detail with companies that asked it |
| `GET` | `/api/search` | Search questions, topics, and companies |
| `GET` | `/api/topics` | List all DSA topics with question counts |
| `GET` | `/api/topics/:slug` | Questions for a specific topic |
| `GET` | `/api/stats` | Platform-wide statistics |
| `POST` | `/api/contact` | Submit contact form |

### Auth Endpoints (Rate Limited: 10 req / 15 min)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Create account (email, name, password) |
| `POST` | `/api/auth/login` | Authenticate & receive tokens |
| `POST` | `/api/auth/refresh` | Exchange refresh token for new access token |
| `POST` | `/api/auth/logout` | Revoke refresh token (server-side) |
| `GET` | `/api/auth/me` | Get current user profile |

### Protected Endpoints (Require JWT)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard` | Aggregated user analytics (solved, bookmarks, top companies/topics) |
| `GET` | `/api/progress` | Paginated progress records |
| `POST` | `/api/progress` | Upsert question status (solved / attempted / not-started) |
| `POST` | `/api/progress/bulk` | Batch fetch progress for multiple question IDs |
| `PATCH` | `/api/progress/:id/notes` | Update notes for a question |
| `GET` | `/api/bookmarks` | List bookmarked questions |
| `POST` | `/api/bookmarks` | Add a bookmark |
| `DELETE` | `/api/bookmarks/:id` | Remove a bookmark |
| `GET` | `/api/me` | Get user profile |
| `PUT` | `/api/me` | Update name / avatar |
| `PUT` | `/api/me/password` | Change password |

---

## 🗄 Database Schema

7 models defined in [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma):

| Model | Purpose |
| :--- | :--- |
| **Company** | 429+ companies with unique name and URL slug |
| **Question** | LeetCode problems with title, difficulty, link, and topic tags |
| **CompanyQuestion** | Join table linking companies to questions with period, frequency, and acceptance rate |
| **User** | Registered users with hashed passwords |
| **Progress** | Per-user question status tracking (solved / attempted / not-started) with notes and solve timestamps |
| **Bookmark** | Per-user saved questions |
| **RefreshToken** | Server-stored refresh tokens for secure logout and token rotation |

---

## 🔐 Authentication Flow

```
1. User registers/logs in
   └─→ Server returns: { accessToken (7d), refreshToken (30d), user }
   └─→ Frontend stores in localStorage: dsa_token, dsa_refresh_token, dsa_user

2. Authenticated requests
   └─→ Axios interceptor attaches: Authorization: Bearer <accessToken>

3. Token expires (401 response)
   └─→ Axios response interceptor catches 401
   └─→ Calls POST /api/auth/refresh with stored refreshToken
   └─→ Receives new accessToken, retries original request silently

4. Refresh token expired or revoked
   └─→ Dispatches 'dsa_auth_expired' DOM event
   └─→ AuthContext clears state → user redirected to login

5. Logout
   └─→ POST /api/auth/logout deletes refresh token from database
   └─→ Frontend clears localStorage
```

---

## 🖥 Frontend Pages

| Route | Page | Access | Description |
| :--- | :--- | :--- | :--- |
| `/` | Landing | Public | Hero search, platform stats, featured companies |
| `/companies` | Companies | Public | 429+ companies grouped by tier with search & filters |
| `/company/:slug` | Company Detail | Public | Paginated problem list with period tabs, difficulty & topic filters |
| `/questions/:slug` | Question Detail | Public | Problem info, companies that asked it, personal notes (auth) |
| `/topics` | Topics | Public | 10-phase DSA roadmap with all topic cards |
| `/topics/:topic` | Topic Detail | Public | Questions under a specific topic |
| `/search` | Search | Public | Full-text search across all entities |
| `/login` | Login | Public | Email & password authentication |
| `/register` | Register | Public | Account creation |
| `/dashboard` | Dashboard | 🔒 Protected | Personal analytics with progress rings & activity feed |
| `/bookmarks` | Bookmarks | 🔒 Protected | Saved problems list with filtering |
| `/profile` | Profile | 🔒 Protected | Edit name, change password |
| `/about` | About | Public | Platform mission & methodology |
| `/contact` | Contact | Public | Feedback form |
| `/privacy` | Privacy Policy | Public | Privacy policy |
| `/terms` | Terms of Service | Public | Terms of service |

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | — (required) |
| `JWT_SECRET` | Access token signing secret | — (required) |
| `JWT_REFRESH_SECRET` | Refresh token signing secret | — (required) |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | `development` or `production` | `development` |
| `CORS_ORIGIN` | Allowed frontend origin(s) | `http://localhost:5173` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000` |

---

## 🌐 Deployment

| Layer | Platform | URL |
| :--- | :--- | :--- |
| Frontend | **Vercel** | SPA with `vercel.json` rewrite rules |
| Backend | **Render** | `https://dsa-prep-backend.onrender.com` |
| Database | **Aiven** / **Neon** | Managed PostgreSQL with SSL |

### Deploy Checklist

1. **Database**: Provision a PostgreSQL instance, run `prisma migrate deploy`, then `npm run import`
2. **Backend**: Deploy to Render with `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `CORS_ORIGIN` env vars
3. **Frontend**: Deploy to Vercel with `VITE_API_URL` pointing to the backend URL

---

## 📚 Documentation

Detailed documentation lives in the [`docs/`](docs/) directory:

| Document | Description |
| :--- | :--- |
| [**Documentation Hub**](docs/README.md) | Central portal & complete documentation index |
| [**Frontend Architecture**](docs/frontend/architecture.md) | React 19 SPA architecture, design system & directory layout |
| [**TanStack Query Strategy**](docs/frontend/tanstack-query.md) | Cache policies, optimistic updates & data fetching rules |
| [**Backend Architecture**](docs/backend/architecture.md) | Express 5 system design, Prisma 7 models & DB schema |
| [**API Reference**](docs/backend/api-reference.md) | Complete REST API reference with request & response examples |
| [**Product Requirements (PRD)**](docs/product/PRD.md) | Product vision, 4-tier company classification & roadmap |
| [**Local Setup Guide**](docs/backend/setup.md) | Step-by-step local development & PostgreSQL setup |
| [**Postman Collection**](docs/testing/postman.md) | API validation & testing workflows |

---

## 📄 License

This project is licensed under the **ISC License**.

---

<div align="center">

**Built with ❤️ for the DSA interview prep community**

[Report a Bug](../../issues) · [Request a Feature](../../issues) · [Contribute](../../pulls)

</div>
