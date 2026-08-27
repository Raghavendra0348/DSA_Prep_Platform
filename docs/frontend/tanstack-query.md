# TanStack Query in DSA Prep Platform

> A complete reference: **why** we use it, **how** it's set up, and **how every hook works**.

---

## Table of Contents

1. [Why TanStack Query?](#1-why-tanstack-query)
2. [Installation](#2-installation)
3. [Setup — QueryClient & Provider](#3-setup--queryclient--provider)
4. [Query Key Strategy](#4-query-key-strategy)
5. [Hooks in This Project](#5-hooks-in-this-project)
   - [useDashboard](#51-usedashboard)
   - [useCompanies](#52-usecompanies)
   - [useCompany](#53-usecompany)
   - [useTopics](#54-usetopics)
   - [useSearch](#55-usesearch)
   - [useQuestionMutations](#56-usequestionmutations)
6. [Optimistic Updates & Rollback](#6-optimistic-updates--rollback)
7. [Cache Invalidation](#7-cache-invalidation)
8. [DevTools](#8-devtools)
9. [Server State vs Client State — The Mental Model](#9-server-state-vs-client-state--the-mental-model)
10. [Before vs After TanStack Query](#10-before-vs-after-tanstack-query)

---

## 1. Why TanStack Query?

Before TanStack Query, every page managed its own loading state manually:

```js
// OLD pattern — repeated in every component
const [data, setData]       = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError]     = useState(null);

useEffect(() => {
  setLoading(true);
  fetch('/api/...')
    .then(r => r.json())
    .then(d => setData(d))
    .catch(e => setError(e.message))
    .finally(() => setLoading(false));
}, [dep]);
```

**Problems with this:**

| Problem | Impact |
|---------|--------|
| No caching — every navigation refetches | Slow, wastes bandwidth |
| No deduplication — two components fetching the same URL = 2 requests | Server hammered |
| Optimistic UI requires careful rollback code in every component | Bugs everywhere |
| No background refresh — stale data stays until hard-refresh | Bad UX |
| No `isRefetching` distinction — can't show subtle spinners | Only full skeleton |
| After mutations (mark solved), other pages still show old data | Inconsistent UI |

**TanStack Query fixes all of this declaratively.**

- **Caching**: fetch once, serve everywhere from cache for `staleTime`
- **Background refetch**: silently refreshes stale data when user re-focuses
- **Optimistic UI**: write cache directly, rollback on error — one pattern for all mutations
- **Cross-component invalidation**: after marking a question solved, dashboard stats auto-update
- **Devtools**: visual inspector showing every cached query in real-time

---

## 2. Installation

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

**In `package.json`:**
```json
"@tanstack/react-query": "^5.101.4",
"@tanstack/react-query-devtools": "^5.101.4"
```

> We use **v5** (latest). v5 has breaking changes from v4:
> - `isLoading` renamed to `isPending`
> - `cacheTime` renamed to `gcTime`
> - `useQuery` options are now a single object (no positional args)

---

## 3. Setup — QueryClient & Provider

### `src/lib/queryClient.js`

This is the **singleton** — one `QueryClient` for the entire app. It holds all the cached data.

```js
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            1000 * 60 * 3,   // 3 minutes
      gcTime:               1000 * 60 * 10,  // 10 minutes
      retry:                1,
      refetchOnWindowFocus: false,
      refetchOnReconnect:   true,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

**Every setting explained:**

| Option | Value | Reason |
|--------|-------|--------|
| `staleTime` | 3 min | Data is "fresh" for 3 min. No background refetch during this window. DSA problem lists don't change every second. |
| `gcTime` | 10 min | After a component unmounts, the cache entry lives for 10 min. Navigate away and back → instant load from cache. |
| `retry` | 1 | Retry a failed request once. Prevents hammering a slow server. |
| `refetchOnWindowFocus` | false | Prevents surprise refetches while user is typing notes or code. |
| `refetchOnReconnect` | true | If user goes offline and comes back, silently refresh. |
| `mutations.retry` | 0 | Never retry mutations. A double-fire could corrupt state (e.g. double-toggling a bookmark). |

### `src/main.jsx`

The `QueryClientProvider` wraps the **entire app** so every component shares the same cache:

```jsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {/* DevTools only in dev — zero impact on production bundle */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  </StrictMode>,
);
```

---

## 4. Query Key Strategy

### `src/lib/queryKeys.js`

Every `useQuery` needs a **key** — an array that uniquely identifies what data is cached. Instead of magic strings scattered everywhere, all keys live in one factory:

```js
export const QUERY_KEYS = {
  // Simple keys — no params
  dashboard: () => ['dashboard'],
  companies: () => ['companies'],
  topics:    () => ['topics'],
  progress:  () => ['progress'],

  // Parameterized — different slug = different cache entry
  topicDetail: (slug)         => ['topic', slug],
  question:    (slug)         => ['question', slug],
  bookmarks:   (params)       => ['bookmarks', params],

  // Nested — company has sub-resources
  company: {
    stats:    (slug)         => ['company', slug, 'stats'],
    problems: (slug, params) => ['company', slug, 'problems', params],
  },

  // All 3 params are part of the key — different filters = different cache entry
  search: (query, type, difficulty) => ['search', query, type, difficulty],
};
```

**Why arrays?**

TanStack Query supports **hierarchical invalidation**. Invalidating `['company', 'google']` automatically invalidates:
- `['company', 'google', 'stats']`
- `['company', 'google', 'problems', { page: 1, ... }]`

This means you can invalidate an entire entity's cache with one call, without over-fetching unrelated data.

---

## 5. Hooks in This Project

All TanStack Query logic lives in **custom hooks** in `src/hooks/`. Components never call `useQuery` directly.

---

### 5.1 `useDashboard`

**File:** `src/hooks/useDashboard.js`

```js
export function useDashboard() {
  const { data, isPending, isError, error, isRefetching, refetch } = useQuery({
    queryKey: QUERY_KEYS.dashboard(),
    queryFn:  getDashboard,
    staleTime: 1000 * 60 * 2,  // 2 min (shorter — streak/stats should be fresher)
  });

  return {
    dashboardData: data ?? null,
    loading:       isPending,
    isRefetching,   // true during background refresh (not initial load)
    error:         isError ? (error?.message ?? 'Failed') : null,
    refresh:       refetch,
  };
}
```

**What it fetches:** Streak, total solved, difficulty breakdown, recent activity.

**Key decisions:**
- `staleTime: 2min` — shorter than the global 3min because stats change after every "mark solved" action
- Returns `isRefetching` separately so the UI can show a **subtle** spinner on background refresh instead of a full skeleton that destroys layout

---

### 5.2 `useCompanies`

**File:** `src/hooks/useCompanies.js`

```js
export function useCompanies(initialSort = 'name-asc') {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState(initialSort);

  // Server state — React Query handles fetch + cache
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.companies(),
    queryFn:  async () => {
      const res = await getCompanies();
      return res.companies ?? res;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Client state — instant, no network needed
  const companies = useMemo(() => data ?? [], [data]);
  const filteredAndSorted = useMemo(() => {
    let result = [...companies];
    if (search.trim()) {
      result = result.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    }
    result.sort((a, b) => {
      if (sortBy === 'name-asc')       return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc')      return b.name.localeCompare(a.name);
      if (sortBy === 'questions-desc') return (b.questionCount || 0) - (a.questionCount || 0);
      return 0;
    });
    return result;
  }, [companies, search, sortBy]);

  return { companies: filteredAndSorted, totalCount, loading, error, search, setSearch, sortBy, setSortBy, refetch };
}
```

**Key design:** The raw company list is fetched **once** and cached for 5 minutes. Search and sort run entirely in the browser with `useMemo` — typing in the search box **never makes a network request**.

---

### 5.3 `useCompany`

**File:** `src/hooks/useCompany.js`

The most complex hook — two queries and two mutations with optimistic updates.

```js
export function useCompany(slug, params = {}) {
  const qc = useQueryClient();

  // Query 1: Company stats (name, logo, total questions) — cached independently
  const statsQuery = useQuery({
    queryKey: QUERY_KEYS.company.stats(slug),
    queryFn:  () => getCompanyStats(slug),
    staleTime: 1000 * 60 * 5,
  });

  // Query 2: Paginated + filtered problem list — keyed by ALL filter params
  const problemsQuery = useQuery({
    queryKey: QUERY_KEYS.company.problems(slug, { period, difficulty, sortBy, page }),
    queryFn:  () => getCompanyProblems(slug, { period, difficulty, sortBy, page }),
    staleTime: 1000 * 60 * 10,  // 10 min — switching filters hits cache instantly
    gcTime:    1000 * 60 * 30,
  });

  // Mutations defined here (see Section 6)
  const statusMutation   = useMutation({ ... });
  const bookmarkMutation = useMutation({ ... });

  return { companyInfo, stats, problems, pagination, loading, error, updateStatus, toggleBookmark };
}
```

**Why two separate queries for stats and problems?**

Stats (company name, total questions) almost never change. Problems change with every filter change. By splitting:
- Switching difficulty filter only refetches problems — stats header never flickers
- Stats can have a different staleTime from problems

**Why `staleTime: 10min` on problems with all params in the key?**

Each unique filter combination is cached independently:
- `['company', 'google', 'problems', { difficulty: 'EASY', page: 1 }]`
- `['company', 'google', 'problems', { difficulty: 'HARD', page: 1 }]`

Switching Easy → Hard → Easy: the Easy results are already in cache. **0ms load, no spinner shown.**

---

### 5.4 `useTopics`

**File:** `src/hooks/useTopics.js`

```js
export function useTopics() {
  const [search, setSearch] = useState('');

  const { data, isPending, isError, error } = useQuery({
    queryKey: QUERY_KEYS.topics(),
    queryFn:  async () => {
      const res = await getTopics();
      return res.topics ?? res;
    },
    staleTime: 1000 * 60 * 5,
  });

  const allTopics = data ?? [];
  const filteredTopics = search.trim()
    ? allTopics.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    : allTopics;

  return { topics: filteredTopics, rawCount: allTopics.length, loading: isPending, error, search, setSearch };
}
```

Same pattern as `useCompanies` — fetch once, filter client-side. Navigating back to the Topics page after visiting a company page is always **instant** (cache hit).

---

### 5.5 `useSearch`

**File:** `src/hooks/useSearch.js`

```js
export function useSearch(initialQuery = '', initialType = 'all') {
  const [query, setQuery]           = useState(initialQuery);
  const [type, setType]             = useState(initialType);
  const [difficulty, setDifficulty] = useState('');

  const debouncedQuery = useDebounce(query, 280); // wait 280ms after user stops typing
  const enabled = debouncedQuery.trim().length >= 2; // don't search for 0-1 chars

  const { data, isPending, isError, error } = useQuery({
    queryKey: QUERY_KEYS.search(debouncedQuery, type, difficulty),
    queryFn:  () => apiSearch(debouncedQuery, type, difficulty),
    enabled,                    // key flag — query doesn't run when false
    staleTime: 1000 * 60 * 1,  // 1 min — search results can go stale quickly
  });

  return { query, setQuery, type, setType, difficulty, setDifficulty, results, loading, error };
}
```

**Two important patterns:**

1. **`enabled` flag** — `useQuery` with `enabled: false` does nothing. No API call until ≥2 characters typed.

2. **Debounce + Query Key** — `useDebounce` delays the query key update by 280ms. Since TanStack Query only fires when the key changes, this effectively debounces the API call without extra logic. Previous results stay visible while the user types.

3. **Per-combination caching** — typing "binary search" with filter "HARD" and then clearing the filter hits the cached "all" results. Each `(query, type, difficulty)` combination is a separate cache entry.

---

### 5.6 `useQuestionMutations`

**File:** `src/hooks/useQuestionMutations.js`

Centralized mutations for the question detail page (mark solved, toggle bookmark, save notes).

```js
export function useQuestionMutations(questionSlug) {
  const qc = useQueryClient();
  const questionKey = QUERY_KEYS.question(questionSlug);

  // Helper: patch the cached question object directly
  const patchQuestion = (updater) => {
    qc.setQueryData(questionKey, old => old ? { ...old, ...updater(old) } : old);
  };

  // Status mutation — with full optimistic + rollback
  const statusMutation = useMutation({
    mutationFn: ({ questionId, status }) => upsertProgress({ questionId, status }),
    onMutate: async ({ status }) => {
      await qc.cancelQueries({ queryKey: questionKey });
      const prev = qc.getQueryData(questionKey);
      patchQuestion(() => ({ status }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(questionKey, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard() });
    },
  });

  // Bookmark mutation — same pattern, also invalidates bookmarks list
  const bookmarkMutation = useMutation({
    mutationFn: ({ questionId }) => apiToggleBookmark(questionId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: questionKey });
      const prev = qc.getQueryData(questionKey);
      patchQuestion(old => ({ bookmarked: !old.bookmarked }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(questionKey, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.bookmarks({}) });
    },
  });

  // Note mutation — no optimistic needed, user sees their own input
  const noteMutation = useMutation({
    mutationFn: ({ questionId, note }) => updateNotes(questionId, note),
    onSuccess: (_data, { note }) => {
      patchQuestion(() => ({ userNote: note }));
    },
  });

  return {
    mutateStatus:    (questionId, status) => statusMutation.mutate({ questionId, status }),
    mutateBookmark:  (questionId)         => bookmarkMutation.mutate({ questionId }),
    mutateNote:      (questionId, note)   => noteMutation.mutate({ questionId, note }),
    statusPending, bookmarkPending, notePending,
  };
}
```

---

## 6. Optimistic Updates & Rollback

Optimistic updates make the UI feel **instant** by writing to the cache before the server responds. The standard pattern used throughout this project:

```js
useMutation({
  mutationFn: apiCall,

  onMutate: async (variables) => {
    // Step 1: Cancel any in-flight queries for this key
    // (prevents background refetch from overwriting our optimistic value)
    await qc.cancelQueries({ queryKey: targetKey });

    // Step 2: Snapshot current cache (for rollback)
    const prev = qc.getQueryData(targetKey);

    // Step 3: Write the expected result directly to cache
    qc.setQueryData(targetKey, old => ({
      ...old,
      // apply expected change
    }));

    // Step 4: Return snapshot — TanStack passes this as `ctx` to onError/onSettled
    return { prev };
  },

  onError: (_err, _vars, ctx) => {
    // API call failed — restore the previous cache value
    if (ctx?.prev) qc.setQueryData(targetKey, ctx.prev);
  },

  onSettled: () => {
    // Runs after success OR error — invalidate related queries
    qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard() });
  },
});
```

**Why `cancelQueries` before writing?**

Without it, a background refetch completing *after* your optimistic write would overwrite it — the UI would briefly revert then snap back. Cancelling in-flight queries ensures your optimistic value wins.

**Why return `prev` from `onMutate`?**

`onMutate`'s return value becomes the `ctx` (context) argument in `onError` and `onSettled`. This is TanStack Query's official mechanism to pass the snapshot to the rollback function.

---

## 7. Cache Invalidation

After a mutation, **other** queries that depend on the changed data need to know. Two strategies are used:

### Strategy A — `invalidateQueries` (mark stale → background refetch)

```js
// After marking a question solved:
qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard() });
// → Dashboard's staleTime is overridden, it refetches in background
// → The dashboard page updates its streak/solved count without user doing anything
```

### Strategy B — `setQueryData` (direct cache write, zero network)

```js
// Optimistic update — no network call
qc.setQueryData(key, old => ({
  ...old,
  problems: old.problems.map(p =>
    p.id === questionId ? { ...p, status: 'solved' } : p
  ),
}));
```

### Invalidation map in this project

| Mutation | Invalidates | Why |
|----------|-------------|-----|
| Mark solved (question detail) | `dashboard()` | Streak and solved count need to update |
| Toggle bookmark (question detail) | `bookmarks({})` | Bookmarks list page needs to reflect the change |
| Mark solved (company detail) | `dashboard()` | Same — streak update |
| Toggle bookmark (company detail) | _(none — optimistic only)_ | Bookmark list is a separate page, user rarely navigates there immediately |

---

## 8. DevTools

```jsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// In main.jsx — Vite tree-shakes this out of production builds automatically
{import.meta.env.DEV && (
  <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
)}
```

The **React Query Devtools** panel (bottom-left flower icon in dev) shows:
- All cache entries and their keys in real-time
- Current status: `fresh`, `stale`, `fetching`, `inactive`, `paused`
- Time since last fetch, and the raw cached data
- Manual controls to invalidate, remove, or trigger a refetch

This is invaluable for debugging _"why is this query not refetching?"_ or _"is my invalidation targeting the right key?"_

---

## 9. Server State vs Client State — The Mental Model

TanStack Query enforces a critical architectural principle:

| Type | What it is | How managed |
|------|-----------|-------------|
| **Server state** | Data that lives on the server: problems, companies, user progress, bookmarks | `useQuery` / `useMutation` |
| **Client state** | Ephemeral UI state: search text, active filter, sort order, open/closed modals | `useState` / `useMemo` |

**Never mix them.** Example:

```js
// CORRECT — search filter is client state, filter in browser, zero network
const [search, setSearch] = useState('');
const filtered = useMemo(() => data.filter(c => c.name.includes(search)), [data, search]);

// WRONG — this fires a network request on every keypress (300ms debounce still isn't great)
const { data } = useQuery({
  queryKey: ['companies', search],
  queryFn: () => fetch(`/api/companies?q=${search}`),
});
```

In `useCompanies` and `useTopics`, the list is fetched **once** and all filtering/sorting is done in-browser.

---

## 10. Before vs After TanStack Query

### Dashboard — Navigate Back

| Before | After |
|--------|-------|
| Full loading spinner + API call every time | Instant render from cache (2 min staleTime) |
| Background silently refetches after 2 min | |

### Company Page — Change Difficulty Filter

| Before | After |
|--------|-------|
| Full spinner + API call every filter change | First visit fetches; subsequent visits hit cache |
| Easy → Hard → Easy: 3 API calls | Easy → Hard → Easy: 1 API call (Easy served from cache) |

### Mark Question Solved

| Before | After |
|--------|-------|
| Manual `prevProblems` snapshot | `onMutate` snapshot handled by TanStack |
| Manual rollback in `catch` | `onError` rollback with `ctx.prev` |
| Dashboard stats stay stale | `onSettled` auto-invalidates dashboard |
| Complex code in every component | One hook, one pattern, reused everywhere |

---

## File Reference

| File | Purpose |
|------|---------|
| `src/lib/queryClient.js` | Singleton QueryClient with global defaults |
| `src/lib/queryKeys.js` | Centralized query key factory |
| `src/main.jsx` | QueryClientProvider + DevTools setup |
| `src/hooks/useDashboard.js` | Dashboard data fetch |
| `src/hooks/useCompanies.js` | Company list + client-side filter/sort |
| `src/hooks/useCompany.js` | Company detail: two queries + two mutations |
| `src/hooks/useTopics.js` | Topic list + client-side search |
| `src/hooks/useSearch.js` | Debounced search with `enabled` flag |
| `src/hooks/useQuestionMutations.js` | Status, bookmark, note mutations for question detail |
