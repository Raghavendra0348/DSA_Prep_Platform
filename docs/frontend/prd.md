# 🖥️ Frontend PRD — DSA Interview Prep Platform

**Version:** 1.0  
**Date:** August 11, 2026  
**Status:** 🔜 Starting Now  
**Backend:** ✅ 100% Complete — API ready at `http://localhost:5000`

---

## 1. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Framework | React 18 + Vite | Fast HMR, modern bundler |
| Routing | React Router v6 | Declarative routes, nested layouts |
| Styling | Vanilla CSS (CSS variables) | Full control, no framework overhead |
| Icons | Lucide React | Clean, consistent icon set |
| HTTP | Native `fetch` + custom hooks | No extra lib needed |
| Auth state | React Context API | Lightweight, sufficient for JWT |
| Dev server | `npm run dev` (Vite) | Port 5173 |
| Backend URL | `http://localhost:5000` (dev) | Via `VITE_API_URL` env var |

---

## 2. Project Folder Structure

```
frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx                  ← Vite entry point
│   ├── App.jsx                   ← Router + Layout wrapper
│   ├── index.css                 ← Global CSS, design tokens
│   │
│   ├── api/                      ← All fetch calls live here
│   │   ├── client.js             ← Base fetcher (auth header, 401 refresh)
│   │   ├── auth.js               ← register, login, refresh, logout
│   │   ├── companies.js          ← getCompanies, getCompanySlugs
│   │   ├── company.js            ← getCompanyProblems, getCompanyStats
│   │   ├── questions.js          ← getQuestion(slug)
│   │   ├── search.js             ← search(q, type, difficulty)
│   │   ├── topics.js             ← getTopics, getTopicProblems
│   │   ├── progress.js           ← getProgress, upsertProgress, bulkProgress
│   │   ├── bookmarks.js          ← getBookmarks, toggleBookmark
│   │   ├── dashboard.js          ← getDashboard
│   │   ├── user.js               ← getMe, updateProfile, changePassword
│   │   └── stats.js              ← getStats
│   │
│   ├── context/
│   │   └── AuthContext.jsx       ← token, user, login(), logout(), updateUser()
│   │
│   ├── hooks/
│   │   ├── useAuth.js            ← consumes AuthContext
│   │   ├── useCompanies.js       ← fetches /api/companies
│   │   ├── useCompany.js         ← fetches /api/company/:slug + filters
│   │   ├── useProgress.js        ← progress read/write
│   │   ├── useBookmarks.js       ← bookmark toggle
│   │   ├── useDashboard.js       ← fetches /api/dashboard
│   │   ├── useSearch.js          ← fetches /api/search (debounced)
│   │   └── useTopics.js          ← fetches /api/topics
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   └── Footer.jsx
│   │   ├── ui/
│   │   │   ├── DifficultyBadge.jsx
│   │   │   ├── TopicChip.jsx
│   │   │   ├── FrequencyBar.jsx
│   │   │   ├── ProgressRing.jsx
│   │   │   ├── Skeleton.jsx
│   │   │   ├── Spinner.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── BookmarkBtn.jsx
│   │   │   └── EmptyState.jsx
│   │   └── shared/
│   │       ├── SearchInput.jsx
│   │       ├── PeriodTabs.jsx
│   │       ├── FilterBar.jsx
│   │       ├── Pagination.jsx
│   │       └── ProtectedRoute.jsx
│   │
│   └── pages/
│       ├── Landing.jsx
│       ├── Companies.jsx
│       ├── CompanyDetail.jsx
│       ├── QuestionDetail.jsx
│       ├── Search.jsx
│       ├── Topics.jsx
│       ├── TopicDetail.jsx
│       ├── Dashboard.jsx
│       ├── Bookmarks.jsx
│       ├── Profile.jsx
│       ├── Login.jsx
│       └── Register.jsx
│
├── .env                  ← VITE_API_URL=http://localhost:5000
├── package.json
└── vite.config.js
```

---

## 3. Design System (`index.css`)

```css
:root {
  /* Backgrounds */
  --bg-primary:    #0d1117;
  --bg-secondary:  #161b22;
  --bg-card:       #1c2128;
  --bg-hover:      #21262d;

  /* Borders */
  --border:        #30363d;
  --border-muted:  #21262d;

  /* Text */
  --text-primary:  #e6edf3;
  --text-secondary:#8b949e;
  --text-muted:    #7d8590;

  /* Accent */
  --accent:        #58a6ff;
  --accent-hover:  #79b8ff;

  /* Difficulty */
  --easy:          #00b8a3;
  --medium:        #ffa116;
  --hard:          #ef4743;

  /* Status */
  --solved:        #3fb950;
  --attempted:     #d29922;
  --unsolved:      #30363d;

  /* Shape */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
}
```

**Font:** `Inter` (Google Fonts), weights 400/500/600/700  
**Reusable classes:** `.btn` `.btn-primary` `.btn-ghost` `.card` `.badge` `.chip` `.input` `.table` `.skeleton`

---

## 4. Authentication Architecture

### Token Storage (localStorage)
```
dsa_token         → JWT access token (7 days)
dsa_refresh_token → Refresh token (30 days)
dsa_user          → { id, name, email } JSON string
```

### AuthContext Shape
```js
{
  user,          // null | { id, name, email, avatar }
  token,         // null | string
  isLoading,     // true while reading localStorage on mount
  login(data),   // saves tokens + user, updates state
  logout(),      // POST /api/auth/logout, clears storage
  updateUser(u), // updates user in state + storage
}
```

### Auto-Refresh Flow (`api/client.js`)
```
Request → add "Authorization: Bearer <token>"
        → if 401 → POST /api/auth/refresh
                  → success: save new token, retry request
                  → failure: logout(), redirect /login
```

### ProtectedRoute
Redirects unauthenticated users to `/login`, restores destination after login.

---

## 5. Route Map

| Route | Page | Auth |
|---|---|---|
| `/` | Landing | No |
| `/companies` | Company Browser | No |
| `/company/:slug` | Company Detail | No (auth-aware) |
| `/questions/:slug` | Question Detail | No (auth-aware) |
| `/search` | Global Search | No |
| `/topics` | Topics List | No |
| `/topics/:topic` | Topic Detail | No |
| `/login` | Login | No |
| `/register` | Register | No |
| `/dashboard` | Dashboard | ✅ |
| `/bookmarks` | Bookmarks | ✅ |
| `/profile` | Profile | ✅ |

---

## 6. Page Specifications

---

### 6.1 Landing Page `/`
**API:** `GET /api/stats`

**Sections:**
1. **Hero** — Headline + company search + "Browse All →" CTA button
2. **Stats Bar** — Animated count-up numbers: 471 companies · 3,257 questions · 74 topics
3. **Featured Companies** — 12 cards (Google, Meta, Amazon, Apple, Microsoft, Netflix, Flipkart, Paytm, Swiggy, Zomato, Infosys, Wipro)
4. **How It Works** — 3-step section: Pick Company → Choose Period → Track Progress
5. **CTA Banner** — "Start Preparing →" to `/companies`

**Interactions:**
- Hero search → `/companies?q=<term>`
- Featured card click → `/company/:slug`

---

### 6.2 Companies Page `/companies`
**API:** `GET /api/companies`

**Company Card:**
```
Google
443 problems
[Array] [DP] [Graph] [Tree]
████░░░░  24% solved       ← only if logged in
```

**Controls (client-side filter):**
- Text search (instant, updates `?q=` in URL)
- Sort: A–Z | Z–A | Most Questions | My Progress

**States:** 12 skeleton cards while loading · Empty state if no match

---

### 6.3 Company Detail Page `/company/:slug` ⭐
**API:**
- `GET /api/company/:slug/stats` → tab counts
- `GET /api/company/:slug?period=&difficulty=&topics=&sortBy=&page=` → problems
- `POST /api/progress` → status change
- `POST /api/bookmarks` → bookmark toggle

**Layout:**
```
← Back   Google                    443 problems
         [Array][DP][Graph][Tree][BFS]
         ████████░░  42/443 solved (9%)

[30d(52)] [3mo(120)] [6mo(210)] [6+(85)] [All✓]

Difficulty: [All] [Easy] [Medium] [Hard]
Sort: [Frequency↓] [Acceptance] [Difficulty] [Title]
Topics: [Dropdown multiselect]

#  Title       Diff    Freq  Accept   Topics     ★
1  Two Sum     EASY    ████  54.2%    [Array]    ☆
2  LRU Cache   MEDIUM  ███░  39.4%    [Design]   ★

             < 1  2  3  4  5 >
```

**Problem Table Columns:**
| Column | Detail |
|---|---|
| Title | Link → `/questions/:slug`, opens LeetCode in new tab |
| Difficulty | Color-coded badge |
| Frequency | Visual bar |
| Acceptance | `54.2%` |
| Topics | 2 chips + "+N more" |
| Status | Click cycles: ○ → ◑ → ✓ (auth required) |
| Bookmark | ☆ star (auth required) |

**Key behaviors:**
- Period tab switch → new API call with skeleton rows
- Filter change → reset to page 1, new API call
- Status/bookmark → optimistic update + API call
- Tab results cached locally (no re-fetch on revisit)
- URL reflects state: `?period=30days&difficulty=EASY&page=2`

---

### 6.4 Question Detail `/questions/:slug`
**API:** `GET /api/questions/:slug`

- Title + difficulty + topics
- "Solve on LeetCode →" external link
- Companies table: name / frequency / acceptance
- Status selector (auth)
- Bookmark toggle (auth)
- Notes textarea → `PATCH /api/progress/:id/notes` (auth)

---

### 6.5 Search `/search`
**API:** `GET /api/search?q=&type=&difficulty=&limit=`

- Large search input
- Type toggle: All | Questions | Topics | Companies
- Difficulty filter (questions only)
- Results in 3 labelled sections
- URL: `/search?q=two+sum&type=questions`
- Debounce 300ms · min 2 chars

---

### 6.6 Topics `/topics`
**API:** `GET /api/topics`

Grid of topic cards sorted by problem count. Each card: name + problem count. Hover → glow + "Explore →".

---

### 6.7 Topic Detail `/topics/:topic`
**API:** `GET /api/topics/:topic?difficulty=&page=&limit=`

- Topic name header
- Difficulty filter
- Problem table (same as company detail, minus frequency)
- Pagination

---

### 6.8 Dashboard `/dashboard` 🔐
**API:** `GET /api/dashboard`

**4 overview stat cards:**
```
[42 Solved]  [17 Attempted]  [8 Bookmarks]  [3257 Total]
```

**Difficulty bars:** Easy 15 / Medium 22 / Hard 5

**Top 5 Companies** by solved count (list/bar chart)

**Top 5 Topics** by solved count (tag cloud or list)

**Recent Activity** — last 10 problems with status + time

---

### 6.9 Bookmarks `/bookmarks` 🔐
**API:** `GET /api/bookmarks?page=&limit=`

Problem table (same columns as company detail). Remove bookmark → toggle off. Paginated.

---

### 6.10 Profile `/profile` 🔐
**API:** `GET /api/me` · `PUT /api/me` · `PUT /api/me/password`

- Avatar + name + email display
- Edit name / avatar URL form
- Change password form (current + new + confirm)
- Account stats: joined date, total solved count

---

### 6.11 Login `/login`
**API:** `POST /api/auth/login`

Email + Password form. On success → save tokens, redirect. Inline errors for `INVALID_CREDENTIALS`. Link to `/register`.

---

### 6.12 Register `/register`
**API:** `POST /api/auth/register`

Name + Email + Password form. Client-side validation. On success → auto-login, redirect to `/dashboard`. Inline errors for `EMAIL_EXISTS`.

---

## 7. API Client (`api/client.js`)

```js
const BASE = import.meta.env.VITE_API_URL;

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('dsa_token');
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  });

  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) return apiFetch(path, options); // retry once
    // refresh failed → AuthContext.logout() triggered elsewhere
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.error || 'Request failed'), {
      code: err.code,
      status: res.status,
    });
  }
  return res.json();
}
```

---

## 8. State Management

| State | Where | Why |
|---|---|---|
| Auth (token, user) | `AuthContext` | Shared across all pages |
| Company list | `useCompanies` hook | Fetched once |
| Company problems | `useCompany` hook | Re-fetched on filter change |
| Progress / Bookmarks | API on demand | No global cache needed |
| UI filters | Component local state | Only needed in CompanyDetail |
| Tab data cache | `useRef` map in `useCompany` | Avoid re-fetching same tab |

> **No Redux/Zustand.** AuthContext + custom hooks + local state is sufficient.

---

## 9. Loading & Error Patterns

| State | UI Treatment |
|---|---|
| Loading | Skeleton blocks (not spinner) |
| API Error | Inline message + "Try again" button |
| Empty results | Empty state illustration + hint |
| Auth required | ProtectedRoute → `/login` redirect |

---

## 10. Build Order (4 Phases)

### Phase 1 — Foundation (Day 1)
- [ ] `npx create-vite frontend -- --template react`
- [ ] Install: `react-router-dom`, `lucide-react`
- [ ] `index.css` — all CSS tokens + global reset + base classes
- [ ] `api/client.js` — base fetcher with auth header + refresh logic
- [ ] `AuthContext.jsx` — full token management
- [ ] `App.jsx` — all 12 routes wired up
- [ ] `Navbar.jsx` — links + auth-aware user display
- [ ] `ProtectedRoute.jsx`

### Phase 2 — Core Pages (Days 2–5)
- [ ] `Landing.jsx`
- [ ] `Companies.jsx`
- [ ] `CompanyDetail.jsx` ← biggest, most complex
- [ ] `Login.jsx` + `Register.jsx`

### Phase 3 — Feature Pages (Days 6–8)
- [ ] `Dashboard.jsx`
- [ ] `Search.jsx`
- [ ] `Topics.jsx` + `TopicDetail.jsx`
- [ ] `QuestionDetail.jsx`
- [ ] `Bookmarks.jsx`
- [ ] `Profile.jsx`

### Phase 4 — Polish (Days 9–10)
- [ ] Skeleton loading on all pages
- [ ] Empty states
- [ ] Responsive layout (mobile/tablet)
- [ ] Hover animations + transitions
- [ ] `document.title` per page (SEO)
- [ ] Error boundaries

---

## 11. Environment Variables

```env
# frontend/.env
VITE_API_URL=http://localhost:5000
```

---

## 12. Deployment Plan

| Service | What | How |
|---|---|---|
| Vercel | Frontend (React build) | Connect GitHub, set `VITE_API_URL` to Railway URL |
| Railway | Backend (Express) | `npm start`, all `.env` vars configured |
| Aiven | PostgreSQL (production) | Change `DATABASE_URL` in Railway env only |

---

## 13. UI/UX Principles

1. **Dark mode only** — `#0d1117` GitHub dark background
2. **Color-coded difficulty** — green / orange / red, consistent everywhere
3. **Skeleton loading** — never show a blank page
4. **Optimistic updates** — status/bookmark feel instant
5. **URL as state** — filters/period/page reflected in URL (shareable links)
6. **Auth-aware pages** — same page works for anonymous + logged-in users
7. **Micro-animations** — hover glow on cards, smooth tab transitions
8. **Mobile-first responsive** — all layouts work from 375px+
