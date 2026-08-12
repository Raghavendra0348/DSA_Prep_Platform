# 🚀 Frontend Implementation Plan

**Project:** DSA Interview Prep Platform
**Date:** August 11, 2026
**Stack:** React 19 + Vite 8 + React Router v7 + Vanilla CSS + Lucide React
**Backend:** ✅ Complete at `http://localhost:5000`

---

## Phase 1 — Foundation & Infrastructure (Day 1)

> **Goal:** Project skeleton, API layer, auth system, routing, layout shell.

### 1.1 Folder Structure Setup

Create all directories upfront:

```
src/
├── api/           ← HTTP client + endpoint wrappers
├── context/       ← AuthContext
├── hooks/         ← Custom data-fetching hooks
├── components/
│   ├── layout/    ← Navbar, Footer
│   ├── ui/        ← DifficultyBadge, TopicChip, FrequencyBar, etc.
│   └── shared/    ← SearchInput, PeriodTabs, FilterBar, Pagination, ProtectedRoute
└── pages/         ← One file per route
```

**Files to create:**

- [ ] All empty directories
- [ ] `.env` → `VITE_API_URL=http://localhost:5000`

---

### 1.2 API Client Layer (`src/api/`)

**`client.js`** — Core fetcher used by every API call:

| Feature      | Detail                                                                        |
| ------------ | ----------------------------------------------------------------------------- |
| Base URL     | From`import.meta.env.VITE_API_URL`                                          |
| Auth header  | Auto-attaches`Authorization: Bearer <token>` from localStorage              |
| 401 handling | Attempts`POST /api/auth/refresh` → retries once → on fail: clears tokens  |
| Error shape  | Throws`{ message, code, status }` from backend `{ error, code }` response |
| JSON body    | Auto`Content-Type: application/json` + `JSON.stringify` on POST/PUT/PATCH |

**Endpoint wrapper files** (thin functions calling `client.js`):

| File             | Functions                                                                                             | Backend Endpoints                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `auth.js`      | `register(data)`, `login(data)`, `refreshToken(token)`, `logout(token)`                       | POST`/api/auth/*`                                          |
| `stats.js`     | `getStats()`                                                                                        | GET`/api/stats`                                            |
| `companies.js` | `getCompanies()`, `getCompanySlugs()`                                                             | GET`/api/companies`, `/api/companies/slugs`              |
| `company.js`   | `getCompanyProblems(slug, params)`, `getCompanyStats(slug)`                                       | GET`/api/company/:slug`, `/api/company/:slug/stats`      |
| `questions.js` | `getQuestion(slug)`                                                                                 | GET`/api/questions/:slug`                                  |
| `search.js`    | `search(q, type, difficulty, limit)`                                                                | GET`/api/search`                                           |
| `topics.js`    | `getTopics()`, `getTopicProblems(topic, params)`                                                  | GET`/api/topics`, `/api/topics/:topic`                   |
| `progress.js`  | `getProgress(params)`, `upsertProgress(data)`, `bulkProgress(ids)`, `updateNotes(qId, notes)` | GET/POST`/api/progress`, PATCH `/api/progress/:id/notes` |
| `bookmarks.js` | `getBookmarks(params)`, `toggleBookmark(questionId)`                                              | GET/POST`/api/bookmarks`                                   |
| `dashboard.js` | `getDashboard()`                                                                                    | GET`/api/dashboard`                                        |
| `user.js`      | `getMe()`, `updateProfile(data)`, `changePassword(data)`                                        | GET/PUT`/api/me`, PUT `/api/me/password`                 |

---

### 1.3 Auth Context (`src/context/AuthContext.jsx`)

**State shape:**

```js
{ user, token, isLoading, login(), logout(), updateUser() }
```

**Behavior:**

- On mount: read `dsa_token`, `dsa_refresh_token`, `dsa_user` from localStorage
- `login(response)`: saves tokens + user to state + localStorage
- `logout()`: calls `POST /api/auth/logout`, clears localStorage, resets state
- `updateUser(user)`: updates state + localStorage (after profile edit)

**localStorage keys:**

```
dsa_token          → JWT access token (7-day expiry)
dsa_refresh_token  → refresh token (30-day expiry)
dsa_user           → JSON { id, name, email }
```

---

### 1.4 Routing (`src/App.jsx`)

```
/                    → Landing
/companies           → Companies
/company/:slug       → CompanyDetail
/questions/:slug     → QuestionDetail
/search              → Search
/topics              → Topics
/topics/:topic       → TopicDetail
/login               → Login
/register            → Register
/dashboard           → Dashboard        (protected)
/bookmarks           → Bookmarks        (protected)
/profile             → Profile          (protected)
```

**`ProtectedRoute`** — wraps protected routes, redirects to `/login` if no token, stores intended destination for post-login redirect.

---

### 1.5 Layout Components

**`Navbar.jsx`:**

- Logo "DSA Prep" (links to `/`)
- Nav links: Companies · Topics · Search
- Auth area: Login/Register buttons OR user avatar + dropdown (Dashboard, Bookmarks, Profile, Logout)
- Sticky, glassmorphism background on scroll
- Mobile: hamburger menu

**`Footer.jsx`:**

- "Built for interview prep" tagline
- Links: GitHub, About
- Copyright

---

### 1.6 Phase 1 Checklist

[ ]  Create all directories (`api/`, `context/`, `hooks/`, `components/layout/`, `components/ui/`, `components/shared/`, `pages/`)

[ ]  `api/client.js` — base fetcher with auth + refresh logic

[ ]  All 11 `api/*.js` endpoint wrappers

[ ]  `context/AuthContext.jsx` — full token lifecycle

[ ]  `hooks/useAuth.js` — convenience hook

[ ]  `components/shared/ProtectedRoute.jsx`

[ ]  `components/layout/Navbar.jsx`

[ ]  `components/layout/Footer.jsx`

[ ]  `App.jsx` — Router with all 12 routes

[ ]

[ ] 

+ [ ] 

[ ]  Verify: `npm run dev` shows Navbar + blank page per route

---

## Phase 2 — UI Components Library (Day 2)

> **Goal:** Build all reusable UI atoms before any page. Every page will compose from these.

### 2.1 UI Components (`src/components/ui/`)

| Component           | Props                             | Renders                                                                |
| ------------------- | --------------------------------- | ---------------------------------------------------------------------- |
| `DifficultyBadge` | `difficulty`                    | Colored pill: EASY (green), MEDIUM (orange), HARD (red)                |
| `TopicChip`       | `topic`, `onClick?`           | Small tag: "Array", "DP", clickable to`/topics/:slug`                |
| `FrequencyBar`    | `value` (0–100)                | Horizontal fill bar with gradient, label on right                      |
| `StatusBadge`     | `status`, `onClick?`          | Circle icon: ○ not-started, ◑ attempted, ✓ solved — click to cycle |
| `BookmarkBtn`     | `active`, `onClick`           | ☆/★ star icon, scales on click                                       |
| `ProgressRing`    | `solved`, `total`             | Circular SVG ring with percentage text inside                          |
| `Skeleton`        | `width`, `height`, `count?` | Shimmer loading block(s), supports card/row/text variants              |
| `Spinner`         | `size?`                         | Small inline rotating spinner                                          |
| `EmptyState`      | `message`, `icon?`            | Illustration/icon + message + optional CTA button                      |

### 2.2 Shared Components (`src/components/shared/`)

| Component       | Props                                                | Behavior                                                  |
| --------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| `SearchInput` | `value`, `onChange`, `placeholder`             | Search icon + input + clear button, debounced 300ms       |
| `PeriodTabs`  | `active`, `onChange`, `stats`                  | 5 tabs: 30d / 3mo / 6mo / 6+ / All with count badges      |
| `FilterBar`   | `difficulty`, `sortBy`, `topics`, `onChange` | Difficulty multi-toggle + sort dropdown + topics dropdown |
| `Pagination`  | `page`, `totalPages`, `onChange`               | ‹ 1 2 3 ... N › with current page highlighted           |

### 2.3 Phase 2 Checklist

- [ ] `DifficultyBadge.jsx` + CSS
- [ ] `TopicChip.jsx` + CSS
- [ ] `FrequencyBar.jsx` + CSS
- [ ] `StatusBadge.jsx` + CSS
- [ ] `BookmarkBtn.jsx` + CSS
- [ ] `ProgressRing.jsx` + CSS (SVG)
- [ ] `Skeleton.jsx` + CSS (shimmer animation)
- [ ] `Spinner.jsx`
- [ ] `EmptyState.jsx`
- [ ] `SearchInput.jsx`
- [ ] `PeriodTabs.jsx` + CSS
- [ ] `FilterBar.jsx` + CSS
- [ ] `Pagination.jsx` + CSS

---

## Phase 3 — Landing Page (Day 3)

> **Goal:** First visual — make it impressive.

### 3.1 Hero Section

- Large heading: "Ace Your Tech Interview"
- Subheading: "Browse 471+ companies' real LeetCode questions..."
- Company search input (navigates to `/companies?q=...`)
- "Browse All Companies →" CTA button
- Animated gradient/particle background or subtle grid pattern

### 3.2 Stats Bar

- 4 animated counters from `GET /api/stats`: Companies · Questions · Topics · Users
- Count-up animation on scroll into view
- Icons from Lucide

### 3.3 Featured Companies Grid

- 12 hand-picked company cards (2 rows × 6):
  - Row 1: Google, Meta, Amazon, Apple, Microsoft, Netflix
  - Row 2: Flipkart, Paytm, Swiggy, Zomato, Infosys, Wipro
- Each card: company name + question count + top 3 topics
- Hover: glow border + "View Problems →"
- Click → `/company/:slug`

### 3.4 How It Works

- 3 steps with icons:
  1. 🏢 Pick a Company
  2. ⏱️ Choose Time Period
  3. 🎯 Filter & Solve
- Clean visual flow: step → arrow → step

### 3.5 CTA Banner

- "Start Your DSA Prep Today"
- Button → `/companies`
- Subtle gradient background

### 3.6 Phase 3 Checklist

- [ ] `pages/Landing.jsx`
- [ ] Hero section with search + CTA
- [ ] Stats bar with animated counters (uses `GET /api/stats`)
- [ ] Featured companies grid (uses `GET /api/companies/slugs` for real data)
- [ ] How It Works section
- [ ] CTA banner
- [ ] Full responsive layout (mobile/tablet/desktop)
- [ ] Skeleton loading for stats + companies

---

## Phase 4 — Auth Pages (Days 3–4)

> **Goal:** Working login/register, token management, protected routes.

### 4.1 Login Page (`/login`)

- Clean centered form card
- Fields: Email, Password
- "Login" primary button
- Inline error messages (wrong password, validation)
- "Don't have an account? Register →" link
- On success: save tokens → redirect to previous page or `/dashboard`

### 4.2 Register Page (`/register`)

- Fields: Full Name, Email, Password
- Client-side validation (email format, min 6 chars password)
- Inline errors for `EMAIL_EXISTS`, `VALIDATION_ERROR`
- On success: auto-login → redirect to `/dashboard`
- "Already have an account? Login →" link

### 4.3 Phase 4 Checklist

- [ ] `pages/Login.jsx` — form + validation + API call + redirect
- [ ] `pages/Register.jsx` — form + validation + API call + auto-login
- [ ] Both pages redirect to `/dashboard` if already logged in
- [ ] Error handling for all backend error codes
- [ ] Loading spinner on submit button

---

## Phase 5 — Company Pages (Days 4–6) ⭐ Core

> **Goal:** The main feature — browsing companies and their problems.

### 5.1 Companies List Page (`/companies`)

**Data:** `GET /api/companies` on mount

**Layout:**

- Search bar at top (client-side instant filter)
- Sort dropdown: A–Z | Z–A | Most Questions
- Responsive grid: 3-col desktop, 2-col tablet, 1-col mobile

**Company Card:**

- Company name (bold)
- Question count
- Top 3–5 topic chips
- Progress bar (if logged in): "42/443 solved"
- Hover: border glow + lift

**States:**

- Loading: 12 skeleton cards
- Empty: "No companies match '...'"

**URL:** `/companies?q=google` (search synced to URL)

### 5.2 Company Detail Page (`/company/:slug`) ⭐

**This is the most complex page. Components needed:**

**Header:**

- ← Back button
- Company name + total question count
- Top 5 topics as chips
- Progress bar + percentage (if logged in)

**Period Tabs (`PeriodTabs`):**

- `[30d (52)] [3mo (120)] [6mo (210)] [6+ (85)] [All ✓(443)]`
- Tab counts from `GET /api/company/:slug/stats`
- Active tab in URL: `?period=30days`
- Tab data cached in `useRef` (no re-fetch on revisit)

**Filter Bar (`FilterBar`):**

- Difficulty toggle: All / Easy / Medium / Hard
- Sort: Frequency↓ | Acceptance | Difficulty | Title
- Topics: multi-select dropdown (populated from company stats)
- Any filter change → reset page to 1, new API call

**Problem Table:**

| # | Title   | Difficulty     | Frequency        | Accept % | Topics         | Status | ★ |
| - | ------- | -------------- | ---------------- | -------- | -------------- | ------ | -- |
| 1 | Two Sum | `EASY` badge | `████` bar | 54.2%    | [Array] [Hash] | ○     | ☆ |

- Title: link to `/questions/:slug`, external icon to LeetCode (new tab)
- Status click: cycles ○→◑→✓ — calls `POST /api/progress` (optimistic UI)
- Bookmark click: ☆↔★ — calls `POST /api/bookmarks` (optimistic UI)
- Both show "Login to track" tooltip if not authenticated

**Pagination:**

- `< 1 2 3 ... 9 >` at bottom
- Page in URL: `?page=2`

**Full URL example:** `/company/google?period=30days&difficulty=EASY,MEDIUM&sortBy=frequency&page=2`

### 5.3 Custom Hook: `useCompany(slug)`

Manages all company page state:

```js
{
  company,         // company name, slug
  stats,           // tab counts from /stats
  problems,        // current page results
  pagination,      // { page, total, totalPages }
  loading,         // boolean
  error,           // null | Error

  // Actions
  setPeriod(p),
  setDifficulty(d),
  setSortBy(s),
  setTopics(t),
  setPage(n),
  updateStatus(questionId, status),
  toggleBookmark(questionId),
}
```

### 5.4 Phase 5 Checklist

- [ ] `hooks/useCompanies.js` — fetch + search + sort logic
- [ ] `pages/Companies.jsx` — grid + search + sort + cards
- [ ] `hooks/useCompany.js` — full filter/tab/pagination state machine
- [ ] `pages/CompanyDetail.jsx` — header + tabs + filters + table + pagination
- [ ] Status cycling (optimistic update + API call)
- [ ] Bookmark toggle (optimistic update + API call)
- [ ] Tab data caching (no re-fetch on tab revisit)
- [ ] URL ↔ state sync (period, difficulty, sortBy, page)
- [ ] Loading: skeleton table rows
- [ ] Empty: "No problems match your filters"
- [ ] Responsive table → cards on mobile

---

## Phase 6 — Discovery Pages (Days 7–8)

> **Goal:** Search, topics, and question detail.

### 6.1 Search Page (`/search`)

- Large search input (auto-focused)
- Type toggle: All | Questions | Topics | Companies
- Difficulty filter (questions only)
- URL: `/search?q=two+sum&type=questions`
- Debounced API call (300ms)
- Results in 3 collapsible sections

**Question result card:** Title + difficulty + topics + "Asked by N companies" + top 3 company chips
**Topic result:** Name + problem count → link to `/topics/:slug`
**Company result:** Name + question count → link to `/company/:slug`

### 6.2 Topics Page (`/topics`)

- Grid of topic cards sorted by problem count
- Each card: topic name + count + color accent
- Click → `/topics/:topic`
- Optional: client-side search filter

### 6.3 Topic Detail Page (`/topics/:topic`)

- Header: topic name + total count
- Difficulty filter
- Problem table (similar to company detail but no frequency column)
- Pagination

### 6.4 Question Detail Page (`/questions/:slug`)

- Title + difficulty badge + topic chips
- "Solve on LeetCode →" large external link button
- **Companies section:** table of all companies that asked this question (name + frequency + acceptance)
- **User section (auth):** status selector + bookmark + notes textarea
- Notes save → `PATCH /api/progress/:id/notes`

### 6.5 Phase 6 Checklist

- [ ] `hooks/useSearch.js` — debounced search with type/difficulty params
- [ ] `pages/Search.jsx` — input + type toggle + results sections
- [ ] `hooks/useTopics.js`
- [ ] `pages/Topics.jsx` — topic grid
- [ ] `pages/TopicDetail.jsx` — topic problems + filters + pagination
- [ ] `pages/QuestionDetail.jsx` — full question view + companies + notes

---

## Phase 7 — User Dashboard & Profile (Days 8–9)

> **Goal:** Authenticated user features.

### 7.1 Dashboard (`/dashboard`)

**API:** `GET /api/dashboard` — all data in one call.

**Section 1 — Overview Cards (4 stat boxes):**

```
[🟢 42 Solved]  [🟡 17 Attempted]  [⭐ 8 Bookmarks]  [📋 3257 Total]
```

**Section 2 — Difficulty Breakdown:**

- 3 horizontal progress bars: Easy (15) / Medium (22) / Hard (5)
- Or a donut chart

**Section 3 — Top Companies:**

- Top 5 companies by solved count
- Each: company name + solved count + link to company page

**Section 4 — Top Topics:**

- Top 5 topics by solved count

**Section 5 — Recent Activity:**

- Last 10 problem interactions
- Each: title + difficulty badge + status + timestamp
- Click → `/questions/:slug`

### 7.2 Bookmarks Page (`/bookmarks`)

**API:** `GET /api/bookmarks?page=&limit=`

- Problem table (same columns as company detail)
- Un-bookmark button per row → `POST /api/bookmarks` (toggle off)
- Pagination
- Empty state: "No bookmarks yet. Star problems while studying."

### 7.3 Profile Page (`/profile`)

**API:** `GET /api/me`, `PUT /api/me`, `PUT /api/me/password`

**Section 1 — Profile Info:**

- Avatar (URL display) + name + email + joined date
- Edit button → inline edit mode for name + avatar URL

**Section 2 — Change Password:**

- Form: Current Password + New Password + Confirm New Password
- Client-side validation: match check, min 6 chars
- Success: "Password changed. Please log in again."

### 7.4 Phase 7 Checklist

- [ ] `hooks/useDashboard.js`
- [ ] `pages/Dashboard.jsx` — overview + difficulty + companies + topics + activity
- [ ] `pages/Bookmarks.jsx` — paginated bookmark list
- [ ] `pages/Profile.jsx` — profile edit + password change

---

## Phase 8 — Polish & Responsive (Days 9–10)

> **Goal:** Premium look, mobile-ready, production-ready.

### 8.1 Loading States

- [ ] Skeleton loading on every page (never blank)
- [ ] Button loading spinners on form submissions
- [ ] Page transition fade-in

### 8.2 Error Handling

- [ ] Inline error messages on all forms
- [ ] API error → "Something went wrong" + "Try again" button
- [ ] 404 page for unknown routes

### 8.3 Empty States

- [ ] Companies: "No companies match..."
- [ ] Search: "No results for '...'"
- [ ] Bookmarks: "No bookmarks yet..."
- [ ] Dashboard (new user): "Start solving to see stats"

### 8.4 Responsive Design

- [ ] Navbar → hamburger on mobile
- [ ] Company grid: 3→2→1 columns
- [ ] Problem table → stacked cards on mobile (< 768px)
- [ ] Dashboard cards: 4→2→1 columns
- [ ] Touch-friendly tap targets (min 44px)

### 8.5 Animations & Micro-interactions

- [ ] Card hover: border glow + subtle lift (`transform: translateY(-2px)`)
- [ ] Button hover: color shift + shadow
- [ ] Status toggle: scale pulse on click
- [ ] Bookmark: star fills with bounce
- [ ] Tab switch: underline slide animation
- [ ] Stats counter: count-up on scroll
- [ ] Page transitions: fade-in on mount

### 8.6 SEO & Accessibility

- [ ] `document.title` updates per page (React `useEffect`)
- [ ] Semantic HTML: `<main>`, `<nav>`, `<article>`, `<section>`
- [ ] All interactive elements have unique IDs
- [ ] Keyboard navigation (tab order, Enter to activate)
- [ ] ARIA labels on icon-only buttons (bookmark, status)
- [ ] `alt` text on images

### 8.7 Performance

- [ ] Client-side tab caching (company detail)
- [ ] Debounced search (300ms)
- [ ] Lazy-loaded routes (`React.lazy` + `Suspense`)
- [ ] No re-render on unrelated state changes (proper memoization)

### 8.8 Phase 8 Checklist

- [ ] Loading skeletons on all 12 pages
- [ ] Error states on all API-dependent views
- [ ] Empty states on all list views
- [ ] Mobile layout for all pages
- [ ] Hover/click animations on all interactive elements
- [ ] Page titles
- [ ] 404 page
- [ ] Keyboard accessibility
- [ ] Performance audit (no unnecessary re-fetches)

---

## Summary Timeline

| Phase       | Days       | What          | Key Deliverable                                    |
| ----------- | ---------- | ------------- | -------------------------------------------------- |
| **1** | Day 1      | Foundation    | API client, AuthContext, routing, Navbar           |
| **2** | Day 2      | UI Library    | 13 reusable components                             |
| **3** | Day 3      | Landing       | Hero, stats, featured companies                    |
| **4** | Days 3–4  | Auth          | Login + Register pages                             |
| **5** | Days 4–6  | Companies ⭐  | Company list + detail (biggest phase)              |
| **6** | Days 7–8  | Discovery     | Search, Topics, Question detail                    |
| **7** | Days 8–9  | User Features | Dashboard, Bookmarks, Profile                      |
| **8** | Days 9–10 | Polish        | Responsive, animations, loading/error/empty states |

---

## File Creation Order (All 40+ files)

```
Phase 1 (14 files):
  src/api/client.js
  src/api/auth.js
  src/api/stats.js
  src/api/companies.js
  src/api/company.js
  src/api/questions.js
  src/api/search.js
  src/api/topics.js
  src/api/progress.js
  src/api/bookmarks.js
  src/api/dashboard.js
  src/api/user.js
  src/context/AuthContext.jsx
  src/hooks/useAuth.js
  src/components/shared/ProtectedRoute.jsx
  src/components/layout/Navbar.jsx
  src/components/layout/Footer.jsx
  src/App.jsx (rewrite with Router)

Phase 2 (13 files):
  src/components/ui/DifficultyBadge.jsx
  src/components/ui/TopicChip.jsx
  src/components/ui/FrequencyBar.jsx
  src/components/ui/StatusBadge.jsx
  src/components/ui/BookmarkBtn.jsx
  src/components/ui/ProgressRing.jsx
  src/components/ui/Skeleton.jsx
  src/components/ui/Spinner.jsx
  src/components/ui/EmptyState.jsx
  src/components/shared/SearchInput.jsx
  src/components/shared/PeriodTabs.jsx
  src/components/shared/FilterBar.jsx
  src/components/shared/Pagination.jsx

Phase 3–7 (14 files):
  src/pages/Landing.jsx
  src/pages/Login.jsx
  src/pages/Register.jsx
  src/pages/Companies.jsx
  src/pages/CompanyDetail.jsx
  src/pages/QuestionDetail.jsx
  src/pages/Search.jsx
  src/pages/Topics.jsx
  src/pages/TopicDetail.jsx
  src/pages/Dashboard.jsx
  src/pages/Bookmarks.jsx
  src/pages/Profile.jsx
  src/hooks/useCompanies.js
  src/hooks/useCompany.js
  src/hooks/useSearch.js
  src/hooks/useTopics.js
  src/hooks/useDashboard.js
```

**Total: ~45 files across 8 phases.**
