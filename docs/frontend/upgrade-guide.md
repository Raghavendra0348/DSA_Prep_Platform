# 🚀 DSA Prep Platform — Frontend Upgrade Roadmap

> **Document Purpose**: This README outlines a comprehensive set of planned upgrades, new features, and architectural improvements for the DSA Prep Platform frontend (`/frontend`). Use this as the single source of truth for all frontend enhancement work.

---

## 📋 Table of Contents

1. [Current State Snapshot](#-1-current-state-snapshot)
2. [Upgrade Goals & Motivation](#-2-upgrade-goals--motivation)
3. [Dependency Upgrades](#-3-dependency-upgrades)
4. [New Feature Additions](#-4-new-feature-additions)
5. [Architecture Improvements](#-5-architecture-improvements)
6. [UI/UX Enhancements](#-6-uiux-enhancements)
7. [Performance Optimizations](#-7-performance-optimizations)
8. [Developer Experience (DX) Improvements](#-8-developer-experience-dx-improvements)
9. [Implementation Order & Milestones](#-9-implementation-order--milestones)
10. [File-by-File Change Map](#-10-file-by-file-change-map)

---

## 🗂️ 1. Current State Snapshot

### Tech Stack (As-Is)

| Layer | Library / Tool | Version |
|:------|:--------------|:--------|
| Core Framework | React | ^19.2.8 |
| Build Tool | Vite | ^5.4.11 |
| Routing | React Router DOM | ^7.18.2 |
| Server State | TanStack React Query | ^5.101.4 |
| Virtualization | TanStack Virtual | ^3.14.9 |
| HTTP Client | Axios | ^1.19.0 |
| Icons | Lucide React | ^1.31.0 |
| Styling | Vanilla CSS3 | — |

### Existing Pages

| Route | Page Component | Status |
|:------|:-------------|:-------|
| `/` | Landing | ✅ Done |
| `/companies` | Companies Explorer | ✅ Done |
| `/company/:slug` | Company Detail | ✅ Done |
| `/questions/:slug` | Question Detail | ✅ Done |
| `/search` | Global Search | ✅ Done |
| `/topics` | Topics Roadmap | ✅ Done |
| `/topics/:topic` | Topic Detail | ✅ Done |
| `/login` | Login | ✅ Done |
| `/register` | Register | ✅ Done |
| `/dashboard` | User Dashboard | ✅ Done |
| `/bookmarks` | Bookmarks | ✅ Done |
| `/profile` | User Profile | ✅ Done |
| `*` | 404 Not Found | ✅ Done |

### Existing Custom Hooks

| Hook | Purpose |
|:-----|:--------|
| `useAuth` | AuthContext consumer |
| `useClickOutside` | Dropdown/modal close on outside click |
| `useCompanies` | Fetch + filter company list |
| `useCompany` | Single company data & question mutations |
| `useCountUp` | Animated number counter |
| `useDashboard` | Dashboard stats fetching |
| `useDebounce` | Input debounce utility |
| `useIntersection` | IntersectionObserver for lazy loading |
| `useKeyboard` | Global keyboard shortcut handling |
| `useLocalStorage` | Persistent local storage state |
| `useMediaQuery` | Responsive breakpoint watcher |
| `useQuestionMutations` | Status & bookmark toggle with optimistic update |
| `useSearch` | Global search query + results |
| `useTopics` | Topics list + roadmap data |

---

## 🎯 2. Upgrade Goals & Motivation

The platform has a strong architectural foundation. The goal of this upgrade is to:

- **Enrich user experience** with new interactive features (Study Planner, Code Notes, Streak Tracker)
- **Modernize the design system** with motion design, improved typography, and richer theming
- **Improve developer experience** with TypeScript migration, Storybook, and better testing
- **Boost performance** with better caching, prefetching, and bundle splitting strategies
- **Add social / gamification features** to increase daily engagement and retention

---

## 📦 3. Dependency Upgrades

### Packages to Upgrade

| Package | Current | Target | Reason |
|:--------|:--------|:-------|:-------|
| `vite` | ^5.4.11 | **^6.x** | Vite 6 ships Environment API, better SSR, faster cold starts |
| `@vitejs/plugin-react` | ^4.3.4 | **^4.x latest** | Stay on latest stable for React Compiler support |
| `eslint` | ^10.8.0 | **^9.x (flat config)** | Migrate to ESLint flat config (already using `eslint.config.js`) |
| `lucide-react` | ^1.31.0 | **latest** | Frequent icon additions |
| `axios` | ^1.19.0 | **^1.x latest** | Bug fixes & improved types |

### New Packages to Add

```bash
# Animation Engine
npm install motion                        # Framer Motion lightweight fork (Motion One)

# Date & Time Utilities
npm install date-fns                      # Lightweight date handling for streak tracking

# Form Management
npm install react-hook-form zod           # Performant forms + schema validation

# Charting (Dashboard Improvements)
npm install recharts                      # React-native composable chart library

# Markdown Rendering (Code Notes)
npm install @uiw/react-md-editor          # Markdown editor + preview for code notes

# Code Highlighting (Question Detail)
npm install shiki                         # WASM-based syntax highlighter with VS Code themes

# Drag & Drop (Study Planner)
npm install @dnd-kit/core @dnd-kit/sortable  # Accessible drag-and-drop

# PWA Support
npm install -D vite-plugin-pwa           # Offline support via Service Worker
```

---

## ✨ 4. New Feature Additions

### 4.1 📅 Study Planner (NEW Page: `/planner`)

A personal study plan builder where users drag-and-drop DSA topics into a weekly schedule.

**Key Capabilities:**
- Drag topics from a sidebar into a weekly grid (Mon–Sun) using `@dnd-kit`
- Persist plan to `localStorage` (or backend for logged-in users)
- Mark daily targets as complete with animated checkmarks
- Streak counter showing how many consecutive days the user practiced
- "Auto-Generate Plan" button that creates a 4-week, phase-by-phase plan based on the 10-phase roadmap

**New Files:**
```
src/pages/Planner.jsx
src/pages/Planner.css
src/components/planner/WeeklyGrid.jsx
src/components/planner/TopicSidebar.jsx
src/components/planner/DayColumn.jsx
src/hooks/usePlanner.js
```

---

### 4.2 🔥 Streak Tracker (NEW Component + Dashboard Widget)

Daily visit + solve streak shown prominently on the Dashboard and Navbar.

**Key Capabilities:**
- Calendar heatmap widget (GitHub contribution graph style) using `recharts`
- Current streak and longest streak displayed on the Profile page
- Streak frozen notification when a day is missed
- Toast notification on first solve of the day: "🔥 Day N streak!"

**New Files:**
```
src/components/ui/StreakBadge.jsx
src/components/ui/StreakBadge.css
src/components/ui/HeatmapCalendar.jsx
src/components/ui/HeatmapCalendar.css
src/hooks/useStreak.js
```

**Modified Files:**
```
src/pages/Dashboard.jsx       ← Add streak widget & heatmap
src/pages/Profile.jsx         ← Add streak history section
src/components/layout/Navbar.jsx ← Add streak badge in nav
```

---

### 4.3 📝 Code Notes (NEW Feature on Question Detail)

Allow users to write personal Markdown notes on any question.

**Key Capabilities:**
- Collapsible Markdown editor panel below the question header
- Live preview side-by-side with editor (using `@uiw/react-md-editor`)
- Syntax-highlighted code blocks powered by `shiki`
- Notes persisted to backend via `PATCH /api/notes/:questionId`
- "Export Note as PDF" button using `window.print()`

**New Files:**
```
src/components/ui/CodeNoteEditor.jsx
src/components/ui/CodeNoteEditor.css
src/api/notes.js
src/hooks/useNotes.js
```

**Modified Files:**
```
src/pages/QuestionDetail.jsx  ← Integrate CodeNoteEditor component
```

---

### 4.4 🏆 Achievement Badges System (NEW)

Unlock and display achievement badges based on problem-solving milestones.

**Key Capabilities:**
- Badge definitions stored in frontend data layer (`src/data/badges.js`)
- Unlock triggers: First Solve, 10/25/50/100/250/500 solves, all topics completed, 7-day streak, etc.
- Badge display on Profile page in a showcase grid
- Toast notification on badge unlock with animated badge reveal

**New Files:**
```
src/data/badges.js
src/components/ui/BadgeCard.jsx
src/components/ui/BadgeCard.css
src/components/ui/AchievementToast.jsx
src/hooks/useAchievements.js
```

**Modified Files:**
```
src/pages/Profile.jsx          ← Add badges showcase section
src/components/ui/Toast.jsx    ← Add achievement variant
```

---

### 4.5 🔍 Advanced Search Filters (Enhancement on `/search`)

Upgrade the global search page with multi-dimensional filters.

**Key Capabilities:**
- Filter by: Difficulty (Easy / Medium / Hard), Status (Solved / Attempted / Not Started), Company, Topic
- Sort by: Title A-Z, Difficulty, Frequency, Acceptance Rate
- "Save Search" as a named preset for quick re-use
- URL-synced filter state (`?difficulty=hard&company=google`)

**Modified Files:**
```
src/pages/Search.jsx
src/pages/Search.css
src/hooks/useSearch.js         ← Add multi-filter support
```

---

### 4.6 📊 Enhanced Dashboard Charts (Enhancement on `/dashboard`)

Replace static progress bars with interactive `recharts` visualizations.

**Key Capabilities:**
- Radial Progress Chart for overall completion (replaces ProgressRing)
- Area Chart showing solve history over time (last 30 days)
- Bar Chart comparing solves per topic (Top 5 topics)
- Difficulty Distribution Pie Chart
- All charts animated on mount with spring physics

**Modified Files:**
```
src/pages/Dashboard.jsx
src/pages/Dashboard.css
src/components/ui/StatCard.jsx ← Enhance with trend indicator (▲ +3 today)
```

---

### 4.7 🌗 Multi-Theme Support (Enhancement)

Expand from single dark theme to a theme system with 3+ options.

**Themes:**
| Theme Key | Description |
|:----------|:------------|
| `dark-github` | Current default — deep `#0d1117` base |
| `dark-ocean` | Deep navy blue base |
| `dark-midnight` | Pitch black + purple accents |
| `light-minimal` | Clean white, gray accents |

**Key Capabilities:**
- Theme picker in Navbar dropdown
- Theme stored in `localStorage` and applied to `:root` via `data-theme` attribute
- CSS variables rewritten per theme in `index.css`
- Smooth theme transition animation (`transition: background 0.3s ease`)

**New Files:**
```
src/context/ThemeContext.jsx   ← Theme context provider
src/hooks/useTheme.js          ← Theme hook
src/components/ui/ThemePicker.jsx ← Dropdown with theme swatches
```

**Modified Files:**
```
src/styles/index.css           ← Add [data-theme="..."] CSS variable blocks
src/components/layout/Navbar.jsx  ← Integrate ThemePicker
src/main.jsx                   ← Wrap with ThemeProvider
```

---

### 4.8 🔔 Notification Center (NEW)

In-app notification panel for achievement unlocks, streak reminders, and system announcements.

**Key Capabilities:**
- Bell icon in Navbar with unread count badge
- Slide-in notification drawer from the right
- Notification types: Achievement Unlock, Streak Reminder, Daily Goal Complete
- Mark-all-as-read button
- Notifications stored in `localStorage` (no backend dependency)

**New Files:**
```
src/components/ui/NotificationDrawer.jsx
src/components/ui/NotificationDrawer.css
src/hooks/useNotifications.js
src/context/NotificationContext.jsx
```

**Modified Files:**
```
src/components/layout/Navbar.jsx   ← Add bell icon + unread badge
src/App.jsx                        ← Wrap with NotificationProvider
```

---

## 🏗️ 5. Architecture Improvements

### 5.1 TypeScript Migration (Progressive)

Incrementally migrate the codebase to TypeScript without a big-bang rewrite.

**Plan:**
1. Add `tsconfig.json` and `vite-env.d.ts` without breaking JS files
2. Migrate `src/api/` layer first (pure functions, easiest to type)
3. Migrate `src/hooks/` layer second
4. Migrate `src/components/` and `src/pages/` progressively
5. Use `.tsx` extension for new components going forward

**New Files:**
```
tsconfig.json
tsconfig.node.json
src/vite-env.d.ts
src/types/index.ts             ← Shared type definitions (Question, Company, Topic, User, Badge)
```

---

### 5.2 React Query Integration Expansion

The project already installs `@tanstack/react-query`. Ensure all data fetching goes through React Query.

**Current state**: Most hooks use `useEffect` + `useState` for data fetching.

**Target state**: All server state managed via `useQuery` / `useMutation` with:
- Automatic background refetching
- Stale-while-revalidate caching
- Mutation optimistic updates with `onMutate` / `onError` rollback
- Query prefetching on hover (hover a company card → prefetch company questions)

**Modified Hooks:**
```
src/hooks/useCompanies.js      ← Migrate to useQuery
src/hooks/useCompany.js        ← Migrate to useQuery + useMutation
src/hooks/useDashboard.js      ← Migrate to useQuery
src/hooks/useTopics.js         ← Migrate to useQuery
src/hooks/useSearch.js         ← Migrate to useQuery with debounced key
```

**New File:**
```
src/lib/queryClient.js         ← Shared QueryClient with global config (staleTime, retry)
```

---

### 5.3 Error Boundary Enhancement

Upgrade the existing `ErrorBoundary` with route-level error pages and retry logic.

**New Files:**
```
src/components/shared/RouteError.jsx   ← React Router errorElement component
src/components/shared/RouteError.css
```

**Modified Files:**
```
src/App.jsx                    ← Add errorElement to each Route
src/components/shared/ErrorBoundary.jsx ← Add retry button + error reporting
```

---

### 5.4 API Client Enhancement

Upgrade `src/api/client.js` with improved capabilities:

- Automatic token refresh on 401 responses
- Request deduplication for identical concurrent calls
- AbortController integration for cancelling stale requests on route change

**Modified Files:**
```
src/api/client.js              ← Token refresh interceptor, AbortController
```

---

## 🎨 6. UI/UX Enhancements

### 6.1 Motion Design System

Add `motion` for declarative animations.

**Animation Patterns to Add:**
- Page transition animations (fade + slide) using `AnimatePresence`
- Card stagger animations on list pages (Companies, Topics)
- Modal enter/exit spring animations
- Number count-up animations on Dashboard stats

**Modified Files:**
```
src/App.jsx                    ← Wrap Routes with AnimatePresence
src/pages/Companies.jsx        ← Stagger card mount animations
src/pages/Topics.jsx           ← Stagger phase card animations
src/components/ui/Modal.jsx    ← Spring mount/unmount animation
```

---

### 6.2 Typography Upgrade

**Font Stack:**
| Variable | Font | Usage |
|:---------|:-----|:------|
| `--font-sans` | Inter Variable | Body text, labels, navigation |
| `--font-heading` | Geist / Cal Sans | Headings, hero text |
| `--font-mono` | JetBrains Mono | Code blocks, LeetCode slugs |

**Modified Files:**
```
index.html                     ← Add Google Fonts preconnect + link tags
src/styles/index.css           ← Update font variable tokens
```

---

### 6.3 Improved Mobile Experience

**Improvements:**
- Bottom navigation bar for mobile (`/`, `/companies`, `/topics`, `/dashboard`)
- Collapsible filter panel on Companies & Topics pages on mobile
- Touch-swipe gesture support for topic navigation

**New Files:**
```
src/components/layout/BottomNav.jsx
src/components/layout/BottomNav.css
```

**Modified Files:**
```
src/App.jsx                    ← Render BottomNav conditionally on mobile
src/pages/Companies.jsx        ← Collapsible filter panel
src/pages/Topics.jsx           ← Collapsible filter panel
```

---

### 6.4 Accessibility (a11y) Improvements

- Add `aria-live` regions to status updates (bookmark toggle, status change)
- Ensure all modals have `role="dialog"` and focus trapping
- Color contrast audit — ensure all text meets WCAG AA (4.5:1 ratio)
- Add `aria-label` to all icon-only buttons

**Modified Files:**
```
src/components/ui/Modal.jsx        ← Focus trap
src/components/ui/StatusBadge.jsx  ← aria-live announcement
src/components/ui/BookmarkBtn.jsx  ← aria-label
```

---

## ⚡ 7. Performance Optimizations

### 7.1 Progressive Web App (PWA)

- Cache all static assets and API responses for visited pages
- "Add to Home Screen" prompt on mobile
- Custom offline fallback page

**Modified Files:**
```
vite.config.js                 ← Add VitePWA plugin
src/pages/Offline.jsx          ← NEW: Offline fallback page
public/manifest.webmanifest    ← NEW: PWA manifest
```

---

### 7.2 Image Optimization

- Replace PNG icons with optimized WebP or SVG equivalents
- Use `loading="lazy"` on all `<img>` tags
- Blur-up placeholder strategy for company logos

---

### 7.3 Bundle Analysis & Splitting

- Add `rollup-plugin-visualizer` for bundle size analysis
- Ensure each page route is an independent code-split chunk
- Manual chunk configuration in Vite for vendor libraries

**Modified Files:**
```
vite.config.js                 ← Add visualizer plugin + manual chunk splits
```

---

### 7.4 React Query Prefetching Strategy

- On hover of company card → prefetch company questions
- On hover of topic card → prefetch topic questions  
- On login → prefetch dashboard data

---

## 🛠️ 8. Developer Experience (DX) Improvements

### 8.1 Component Storybook

```bash
npx storybook@latest init
```

**Stories to Create:**
```
src/stories/
├── DifficultyBadge.stories.jsx
├── StatusBadge.stories.jsx
├── StatCard.stories.jsx
├── Toast.stories.jsx
├── Modal.stories.jsx
├── ProgressBar.stories.jsx
└── BadgeCard.stories.jsx
```

---

### 8.2 Unit Testing with Vitest

```bash
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

**Tests to Write:**
```
src/__tests__/
├── hooks/useAuth.test.js
├── hooks/useDebounce.test.js
├── hooks/useLocalStorage.test.js
├── components/StatusBadge.test.jsx
├── components/Modal.test.jsx
└── pages/Login.test.jsx
```

---

### 8.3 Absolute Import Paths

Configure Vite aliases to avoid deep relative imports.

```js
// Before
import { useAuth } from '../../../hooks/useAuth';
// After
import { useAuth } from '@/hooks/useAuth';
```

**Modified Files:**
```
vite.config.js                 ← Add resolve.alias: { '@': '/src' }
jsconfig.json                  ← Add paths: { "@/*": ["src/*"] }
```

---

### 8.4 Husky + lint-staged Pre-commit Hooks

```bash
npm install -D husky lint-staged
npx husky init
```

- Run `eslint --fix` on staged `.jsx`/`.js` files before commit
- Run `prettier --write` on staged CSS files

---

## 📅 9. Implementation Order & Milestones

| Milestone | Feature / Task | Priority | Effort |
|:----------|:--------------|:---------|:-------|
| **M1** | Dependency Upgrades + Absolute Imports | 🔴 High | 1 day |
| **M1** | TypeScript Setup (`tsconfig.json` + types) | 🔴 High | 1 day |
| **M1** | React Query Full Migration | 🔴 High | 2 days |
| **M2** | Multi-Theme System | 🟡 Medium | 1 day |
| **M2** | Typography Upgrade (Google Fonts) | 🟡 Medium | 0.5 day |
| **M2** | Motion Design System (page transitions) | 🟡 Medium | 1 day |
| **M2** | Mobile Bottom Nav + Collapsible Filters | 🟡 Medium | 1 day |
| **M3** | Study Planner Page + Drag & Drop | 🟠 High-Value | 3 days |
| **M3** | Streak Tracker + Heatmap Calendar | 🟠 High-Value | 2 days |
| **M3** | Enhanced Dashboard Charts (Recharts) | 🟠 High-Value | 1.5 days |
| **M4** | Code Notes Editor (Question Detail) | 🟢 Medium | 2 days |
| **M4** | Achievement Badges System | 🟢 Medium | 2 days |
| **M4** | Notification Center | 🟢 Medium | 1.5 days |
| **M5** | Advanced Search Filters | 🟢 Medium | 1 day |
| **M5** | PWA Support + Offline Page | 🟢 Medium | 1 day |
| **M5** | Accessibility Audit + Fixes | 🟢 Medium | 1 day |
| **M6** | Vitest + RTL Unit Tests | 🔵 DX | 2 days |
| **M6** | Storybook Setup + Component Stories | 🔵 DX | 1.5 days |
| **M6** | Bundle Analysis + Code Splitting | 🔵 DX | 0.5 day |
| **M6** | Husky + lint-staged | 🔵 DX | 0.5 day |

**Total estimated effort: ~26 developer-days**

---

## 🗺️ 10. File-by-File Change Map

### New Files to Create (~25 files)

```
frontend/src/
├── types/
│   └── index.ts                          ← Shared TypeScript types (Question, Company, Topic, User, Badge)
├── lib/
│   └── queryClient.js                    ← React Query client config (staleTime, retry, devtools)
├── context/
│   ├── ThemeContext.jsx                   ← Theme provider (data-theme attribute management)
│   └── NotificationContext.jsx           ← Notification provider & state
├── hooks/
│   ├── useTheme.js                        ← Theme selection & persistence hook
│   ├── useStreak.js                       ← Daily streak calculation & localStorage persistence
│   ├── usePlanner.js                      ← Study planner state with dnd-kit integration
│   ├── useNotes.js                        ← Code notes CRUD hook with React Query
│   ├── useAchievements.js                 ← Badge unlock logic & notification trigger
│   └── useNotifications.js               ← In-app notification queue management
├── pages/
│   ├── Planner.jsx                        ← Study Planner with drag-and-drop weekly grid
│   ├── Planner.css
│   └── Offline.jsx                        ← PWA offline fallback page
├── components/
│   ├── planner/
│   │   ├── WeeklyGrid.jsx                 ← 7-column droppable week grid
│   │   ├── TopicSidebar.jsx               ← Draggable topic chips panel
│   │   └── DayColumn.jsx                  ← Single day droppable column
│   ├── layout/
│   │   └── BottomNav.jsx                  ← Fixed mobile bottom navigation bar
│   ├── shared/
│   │   └── RouteError.jsx                 ← React Router errorElement component
│   └── ui/
│       ├── StreakBadge.jsx                 ← Fire emoji + streak count badge
│       ├── HeatmapCalendar.jsx             ← GitHub-style contribution heatmap
│       ├── CodeNoteEditor.jsx             ← Split-pane Markdown editor + preview
│       ├── BadgeCard.jsx                  ← Achievement badge display card
│       ├── AchievementToast.jsx           ← Animated badge unlock toast
│       ├── ThemePicker.jsx                ← Theme swatch dropdown
│       └── NotificationDrawer.jsx        ← Slide-in notification panel
├── api/
│   └── notes.js                           ← Code notes API (CRUD)
└── data/
    └── badges.js                          ← Badge definitions, icons & unlock conditions
```

### Existing Files to Modify (~20 files)

```
frontend/
├── index.html                             ← Add Google Fonts preconnect, PWA manifest link
├── vite.config.js                         ← Aliases (@), PWA plugin, visualizer, chunk splitting
├── package.json                           ← New dependencies
├── tsconfig.json                          ← NEW: TypeScript configuration
└── src/
    ├── App.jsx                            ← AnimatePresence, /planner route, new providers
    ├── main.jsx                           ← Wrap with ThemeProvider + NotificationProvider
    ├── styles/
    │   └── index.css                      ← Multi-theme [data-theme] blocks, new font tokens
    ├── api/
    │   └── client.js                      ← Token refresh interceptor, AbortController support
    ├── hooks/
    │   ├── useCompanies.js                ← Migrate to useQuery
    │   ├── useCompany.js                  ← Migrate to useQuery + useMutation
    │   ├── useDashboard.js                ← Migrate to useQuery
    │   ├── useTopics.js                   ← Migrate to useQuery
    │   └── useSearch.js                   ← Migrate to useQuery + multi-filter + URL sync
    ├── components/
    │   ├── layout/
    │   │   └── Navbar.jsx                 ← ThemePicker, NotificationBell, StreakBadge
    │   ├── shared/
    │   │   └── ErrorBoundary.jsx          ← Add retry button + improved error UI
    │   └── ui/
    │       ├── Modal.jsx                  ← Spring animation, focus trap, ARIA roles
    │       ├── StatusBadge.jsx            ← aria-live region
    │       ├── BookmarkBtn.jsx            ← aria-label for a11y
    │       ├── StatCard.jsx               ← Trend indicator (▲ +3 today)
    │       ├── Toast.jsx                  ← Achievement variant style
    │       └── CompanyLogo.jsx            ← Lazy loading + blur placeholder
    └── pages/
        ├── Dashboard.jsx                  ← Recharts visualizations, streak widget, heatmap
        ├── Profile.jsx                    ← Badges showcase grid, streak history
        ├── QuestionDetail.jsx             ← CodeNoteEditor integration panel
        ├── Companies.jsx                  ← Motion stagger, collapsible mobile filter
        ├── Topics.jsx                     ← Motion stagger, collapsible mobile filter
        └── Search.jsx                     ← Multi-filter panel, URL-synced filter state
```

---

## 🔗 Related Documents

- [Current Frontend README](./frontend/README.md) — Quick start & commands
- [Full Architecture Docs (FRONTEND.md)](./FRONTEND.md) — Existing end-to-end documentation
- [App.jsx Explained](./APP_JSX_EXPLAINED.md) — Component tree walkthrough

---

*Last Updated: August 2026 | Maintained for DSA Prep Platform Frontend Upgrade Initiative*
