# Comprehensive Technical Documentation: Mobile Redesign & Optimizations

This document explains all architectural, visual, and state-management changes implemented across the application, detailing **what** was changed, **why** it was done, and **how** it was built.

---

## 1. Overview of Objectives

| Feature / Goal | Problem / Motivation | Solution / Implementation |
| :--- | :--- | :--- |
| **Mobile Problem Cards Layout** | Standard desktop tables are cramped and hard to read on mobile viewports. | Converted table rows into modern touch-friendly cards featuring title, topic tags, direct LeetCode link, difficulty, and bookmark actions. |
| **Header & Problem Count Placement** | Company total count was misaligned on small screens. | Positioned the `🔗 X problems` badge directly underneath the company name with matching styling. |
| **Timeframe Period Filter Cards** | Flat text tabs lacked visual hierarchy and mobile touch affordance. | Created horizontally scrollable cards with icons, titles, subtitles, count pills, and glowing active states. |
| **Mobile Bottom Navigation Bar** | Mobile users had to rely on a desktop navbar menu. | Added a fixed, glassmorphic bottom navigation bar (`Home`, `Companies`, `Search`, `Topics`, `Profile`). |
| **Instant Dashboard Bookmark Sync** | Bookmark toggling only updated the local question state, causing a delay in dashboard counters. | Added optimistic TanStack Query cache mutations to update the dashboard's `totalBookmarks` stat in memory with 0ms latency. |
| **Dashboard Cleanup** | Manual "Sync" button was redundant with TanStack Query's automatic caching and refetching. | Removed the button from the hero banner to streamline the UI. |

---

## 2. Detailed Technical Breakdown

### A. Company Detail Header & Topic Chips
#### 1. Total Problems Badge Placement
- **File**: [`CompanyDetail.jsx`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/CompanyDetail.jsx) & [`CompanyDetail.css`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/CompanyDetail.css)
- **Why**: Placing the count pill under the company name ensures the company title can grow without wrapping collisions, matching modern mobile app design.
- **How**:
  - Structured `.company-header-info` as a vertical flex column with `align-items: flex-start; gap: 6px;`.
  - Placed `<h1 className="company-title">{companyName}</h1>` on top and `<span className="company-total-badge">...</span>` directly beneath it.

#### 2. Styled Topic Chips with Icons
- **Files**: [`TopicChip.jsx`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/ui/TopicChip.jsx) & [`TopicChip.css`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/ui/TopicChip.css)
- **Why**: Give each topic visual identity and fast recognition.
- **How**:
  - Created a `TOPIC_CONFIG` dictionary mapping topics (e.g., `array`, `string`, `hash-table`, `dynamic-programming`, etc.) to distinct prefixes and colors:
    - `Array` → `::` (Purple `#a855f7`)
    - `String` → `Aa` (Green `#22c55e`)
    - `Hash Table` → `#` (Yellow `#eab308`)
    - `Dynamic Programming` → `⚡` (Blue `#3b82f6`)
  - Topic container styled with `background: rgba(22, 27, 34, 0.85);` and horizontal scrolling.

---

### B. Timeframe Period Filter Cards
- **Files**: [`PeriodTabs.jsx`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/shared/PeriodTabs.jsx) & [`PeriodTabs.css`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/shared/PeriodTabs.css)
- **Why**: Provide instant visual feedback for the active timeframe with rich contextual labels.
- **How**:
  - Rendered all 5 supported timeframes (**30 Days**, **3 Months**, **6 Months**, **6+ Months**, **All Time**) as card buttons.
  - Implemented auto-scroll into view with `useEffect` and `useRef`:
    ```javascript
    useEffect(() => {
      if (activeTabRef.current && scrollRef.current) {
        activeTabRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        });
      }
    }, [active]);
    ```
  - Highlighted active state with glowing border and blue gradient:
    ```css
    .period-card.active {
      background: linear-gradient(180deg, rgba(59, 130, 246, 0.12) 0%, rgba(30, 58, 138, 0.18) 100%);
      border: 1.5px solid #3b82f6;
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.3), inset 0 0 12px rgba(59, 130, 246, 0.15);
    }
    ```
  - Added the quick filter funnel button (`Filter`) that toggles the difficulty/sorting drawer.

---

### C. Problem Cards & Mobile LeetCode Link Redirection
- **Files**: [`CompanyDetail.jsx`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/CompanyDetail.jsx) & [`CompanyDetail.css`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/CompanyDetail.css)
- **Why**: Mobile users need single-tap access to open LeetCode problems directly, accompanied by clean status, difficulty, and bookmark controls.
- **How**:
  - Transformed `.problem-row` into a horizontal flex container on mobile (`@media (max-width: 768px)`):
    1. **Status Checkbox**: Circular button with green checkmark when solved, circular ring outline when attempted/unstarted.
    2. **Title & Topics**: Problem title with ellipsis truncation, with comma-separated topic names underneath in muted gray.
    3. **LeetCode Link**: Orange LeetCode icon wrapped in `<a>` tag with `target="_blank"` and `rel="noopener noreferrer"`.
    4. **Difficulty Badge**: Compact colored pill (`Easy`, `Medium`, `Hard`).
    5. **Bookmark Button**: Lucide `Bookmark` icon for instant toggling.

---

### D. Mobile Bottom Navigation Bar
- **Files**: [`BottomNav.jsx`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/layout/BottomNav.jsx) & [`BottomNav.css`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/layout/BottomNav.css)
- **Why**: Native-feeling navigation experience for smartphone users.
- **How**:
  - Built a persistent bottom navigation bar containing:
    - 🏠 **Home** (`/` or `/dashboard`)
    - 🏢 **Companies** (`/companies` or `/company/*`)
    - 🔍 **Search** (`/search`)
    - 📚 **Topics** (`/topics` or `/topics/*`)
    - 👤 **Profile** (`/profile` or `/login`)
  - Styled with fixed positioning, glassmorphic backdrop blur, and safe-area inset:
    ```css
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 62px;
      background: rgba(13, 17, 23, 0.94);
      backdrop-filter: blur(16px);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      z-index: 990;
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
    ```
  - Added bottom padding to `.main-content` in [`App.css`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/App.css) and `.site-footer` in [`Footer.css`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/layout/Footer.css) so page content is never hidden behind the navigation bar.

---

### E. Instant Dashboard Bookmark Sync (0ms Latency)
- **Files**: [`useCompany.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useCompany.js), [`useTopicDetail.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useTopicDetail.js), [`useBookmarks.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useBookmarks.js)
- **Why**: When a user bookmarks or unbookmarks a question from any page (Company detail, Topic detail, or Bookmarks), the Dashboard saved counter must update instantly without waiting for a server round-trip.
- **How**:
  - Implemented **Dual-Cache Optimistic Updates** in TanStack Query:
    ```javascript
    onMutate: async ({ questionId }) => {
      const key = QUERY_KEYS.company.problems(slug, problemParams);
      const dashKey = QUERY_KEYS.dashboard();

      await Promise.all([
        qc.cancelQueries({ queryKey: key }),
        qc.cancelQueries({ queryKey: dashKey }),
      ]);

      const prev = qc.getQueryData(key);
      const prevDash = qc.getQueryData(dashKey);

      const target = prev?.problems?.find(p => p.id === questionId);
      const isNowBookmarked = target ? !target.bookmarked : true;

      // 1. Optimistically update local problem row
      qc.setQueryData(key, old => ({
        ...old,
        problems: old?.problems?.map(p =>
          p.id === questionId ? { ...p, bookmarked: !p.bookmarked } : p
        ) ?? [],
      }));

      // 2. Optimistically increment/decrement Dashboard stats in memory
      if (prevDash?.stats) {
        qc.setQueryData(dashKey, old => ({
          ...old,
          stats: {
            ...old.stats,
            totalBookmarks: Math.max(0, (old.stats.totalBookmarks ?? 0) + (isNowBookmarked ? 1 : -1)),
          },
        }));
      }

      return { prev, prevDash };
    },
    onError: (_err, _vars, ctx) => {
      // Auto-rollback on network failure
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      if (ctx?.prevDash) qc.setQueryData(dashKey, ctx.prevDash);
    },
    onSettled: () => {
      // Re-validate in background
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard() });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.bookmarks({}) });
    }
    ```

---

### F. Dashboard Cleanup
- **File**: [`Dashboard.jsx`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/Dashboard.jsx)
- **Why**: TanStack Query automatically keeps stats fresh via window focus, reconnect refetching, and cache invalidation. The manual "Sync" button was redundant.
- **How**: Removed `.dash-ui-btn-refresh` from the hero action bar.

---

## 3. List of Modified & Created Files

| File Path | Action | Description |
| :--- | :--- | :--- |
| [`frontend/src/pages/CompanyDetail.jsx`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/CompanyDetail.jsx) | **Modified** | Updated header structure, stats overview card, and mobile problem row layout. |
| [`frontend/src/pages/CompanyDetail.css`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/CompanyDetail.css) | **Modified** | Added responsive mobile card styles, badge alignment under title, and LeetCode link visibility. |
| [`frontend/src/components/shared/PeriodTabs.jsx`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/shared/PeriodTabs.jsx) | **Modified** | Added card rendering for all 5 periods with auto-scroll and quick filter toggle. |
| [`frontend/src/components/shared/PeriodTabs.css`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/shared/PeriodTabs.css) | **Modified** | Styled scrollable cards with icons, subtitles, count pills, and glowing active states. |
| [`frontend/src/components/ui/TopicChip.jsx`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/ui/TopicChip.jsx) | **Modified** | Added topic icon and prefix mappings (`::`, `Aa`, `#`, `⚡`, etc.). |
| [`frontend/src/components/ui/TopicChip.css`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/ui/TopicChip.css) | **Modified** | Dark background and layout adjustments for topic icon prefixes. |
| [`frontend/src/components/ui/BookmarkBtn.jsx`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/ui/BookmarkBtn.jsx) | **Modified** | Switched icon to Lucide `Bookmark` for design consistency. |
| [`frontend/src/components/ui/StatusBadge.css`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/ui/StatusBadge.css) | **Modified** | Updated checkmark and outline shape to circular format. |
| [`frontend/src/components/layout/BottomNav.jsx`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/layout/BottomNav.jsx) | **Created** | Mobile fixed bottom navigation bar with active route highlighting. |
| [`frontend/src/components/layout/BottomNav.css`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/layout/BottomNav.css) | **Created** | Glassmorphic styling, glowing blue active state, and mobile media queries. |
| [`frontend/src/App.jsx`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/App.jsx) | **Modified** | Integrated `BottomNav` into the global app layout. |
| [`frontend/src/App.css`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/App.css) | **Modified** | Added responsive bottom padding for main content. |
| [`frontend/src/components/layout/Footer.css`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/layout/Footer.css) | **Modified** | Added safe bottom padding for mobile footer. |
| [`frontend/src/hooks/useCompany.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useCompany.js) | **Modified** | Implemented dual-cache optimistic updates for bookmark toggling and dashboard stats. |
| [`frontend/src/hooks/useTopicDetail.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useTopicDetail.js) | **Modified** | Added optimistic dashboard bookmark count synchronization. |
| [`frontend/src/hooks/useBookmarks.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useBookmarks.js) | **Modified** | Added optimistic dashboard bookmark decrementing on unbookmark. |
| [`frontend/src/pages/Dashboard.jsx`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/Dashboard.jsx) | **Modified** | Removed the manual Sync button from the hero banner. |
