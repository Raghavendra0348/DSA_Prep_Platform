# Frontend Concepts — DSA Prep Platform

A complete inventory of every concept, pattern, and technique used across the frontend codebase.

---

## 1. Core Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.2 | UI library (functional components + one class component) |
| **Vite** | 5.4 | Dev server, bundler, HMR |
| **React Router DOM** | 7.18 | Client-side routing |
| **TanStack React Query** | 5.101 | Server-state management (caching, mutations) |
| **Axios** | 1.19 | HTTP client |
| **Framer Motion** | 13.1 | Animation library |
| **Lucide React** | 1.31 | Icon library |
| **@react-oauth/google** | 0.13 | Google OAuth integration |
| **@tanstack/react-virtual** | 3.14 | List virtualization |

---

## 2. React Core Concepts

### Hooks Used
| Hook | Where | Purpose |
|---|---|---|
| `useState` | Everywhere | Local component state |
| `useEffect` | Everywhere | Side effects, subscriptions, timers |
| `useRef` | Modal, CommandPalette, useCountUp | DOM refs, mutable values, `requestAnimationFrame` |
| `useCallback` | AuthContext, App, Modal, Toast | Memoized callbacks to prevent re-renders |
| `useMemo` | useBookmarks, Toast | Derived/computed values, expensive calculations |
| `useId` | Modal | Auto-generated unique IDs for accessibility (`aria-labelledby`) |
| `createContext` / `useContext` | AuthContext, ToastContext | Global state via Context API |

### Component Patterns
- **Functional Components** — every component except ErrorBoundary
- **Class Component** — [`ErrorBoundary.jsx`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/shared/ErrorBoundary.jsx) (required for `componentDidCatch` / `getDerivedStateFromError`)
- **JSX** — declarative UI templating throughout
- **Fragments** (`<>...</>`) — grouping without extra DOM nodes ([`Skeleton.jsx`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/ui/Skeleton.jsx))
- **Render Props / Children Pattern** — [`ProtectedRoute`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/shared/ProtectedRoute.jsx), [`ToastProvider`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/ui/Toast.jsx), `AuthProvider`
- **Composition Over Inheritance** — layout shell (`Navbar` + `main` + `Footer` + `BottomNav`) wrapping routed pages
- **Conditional Rendering** — ternaries, `&&` short-circuits, early returns

---

## 3. State Management

### Context API (Global State)
- [`AuthContext`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/context/AuthContext.jsx) — user, token, login/logout/updateUser functions
- [`ToastContext`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/context/ToastContext.js) — toast notification system

### Server State (TanStack React Query)
- **`useQuery`** — declarative data fetching with caching, stale times, and automatic refetching
- **`useMutation`** — server mutations with `onMutate` / `onError` / `onSettled` lifecycle
- **Optimistic Updates** — [`useBookmarks`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useBookmarks.js) and [`useQuestionMutations`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useQuestionMutations.js) apply changes to the cache instantly, then rollback on error
- **Query Key Factory** — centralized [`queryKeys.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/lib/queryKeys.js) for structured cache keys
- **Cache Invalidation** — `invalidateQueries` after mutations to keep data fresh
- **Query Cancellation** — `cancelQueries` before optimistic updates to avoid race conditions
- **QueryClient Configuration** — custom staleTime, gcTime, retry policies in [`queryClient.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/lib/queryClient.js)
- **React Query DevTools** — conditionally rendered in development only

### Local Storage Persistence
- Auth tokens (`dsa_token`, `dsa_refresh_token`) and user data (`dsa_user`) persisted via `localStorage`
- **Lazy state initialization** — `useState(() => localStorage.getItem(...))` to avoid reading storage on every render

---

## 4. Routing

### React Router DOM v7
- **`BrowserRouter`** — HTML5 history-based routing
- **`Routes` / `Route`** — declarative route definitions
- **Dynamic Segments** — `/company/:slug`, `/questions/:slug`, `/topics/:topic`
- **Catch-all Route** — `path="*"` → `NotFound` page
- **Route Aliases** — `/privacy` and `/privacy-policy` both render `Privacy`; `/terms` and `/terms-of-service` both render `Terms`
- **Programmatic Navigation** — `useNavigate()` in CommandPalette
- **`useLocation`** — reading current path for redirect-after-login state
- **`useParams`** — extracting dynamic URL segments
- **Protected Routes** — [`ProtectedRoute`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/shared/ProtectedRoute.jsx) guards `/dashboard`, `/bookmarks`, `/profile`
- **Redirect with State** — `<Navigate to="/login" state={{ from: location.pathname }} replace />`
- **`ScrollToTop`** — resets scroll position on navigation via `useEffect` + `useLocation`
- **SPA Fallback** — [vercel.json](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/vercel.json) rewrites all routes to `index.html`

---

## 5. Code Splitting & Performance

### Lazy Loading
- **`React.lazy()`** — all 16 page components are dynamically imported in [`App.jsx`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/App.jsx#L17-L33)
- **`Suspense`** — wraps routes with a `PageLoader` fallback (spinner)

### Vite Build Optimizations
- **Manual Chunks** — [`vite.config.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/vite.config.js#L53-L72) splits vendor bundles: `vendor-react`, `vendor-router`, `vendor-icons`, `vendor-query`
- **ES2020 Target** — modern browser output
- **Chunk Size Warning** — 400kB limit

### Other Performance Patterns
- **Debouncing** — [`useDebounce`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useDebounce.js) delays search input to reduce API calls
- **`useMemo`** — memoized derived data (bookmark stats, filtered lists, toast context value)
- **`useCallback`** — stable function references to prevent child re-renders
- **Intersection Observer** — [`useIntersection`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useIntersection.js) for lazy scroll-triggered animations
- **List Virtualization** — `@tanstack/react-virtual` dependency (for rendering large lists efficiently)
- **`requestAnimationFrame`** — smooth number count-up animation in [`useCountUp`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useCountUp.js)
- **Resource Hints** — `preconnect` and `dns-prefetch` for Google Fonts and Google Identity Services

---

## 6. Custom Hooks (18 hooks)

| Hook | File | Concept |
|---|---|---|
| `useAuth` | [`useAuth.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useAuth.js) | Context consumer wrapper |
| `useBookmarks` | [`useBookmarks.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useBookmarks.js) | Query + mutation + optimistic UI + filtering |
| `useClickOutside` | [`useClickOutside.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useClickOutside.js) | DOM event delegation |
| `useCompanies` | [`useCompanies.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useCompanies.js) | Data fetching |
| `useCompany` | [`useCompany.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useCompany.js) | Data fetching with params |
| `useCountUp` | [`useCountUp.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useCountUp.js) | rAF animation + easing curves |
| `useDashboard` | [`useDashboard.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useDashboard.js) | Data fetching |
| `useDebounce` | [`useDebounce.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useDebounce.js) | Timer-based value debouncing |
| `useIntersection` | [`useIntersection.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useIntersection.js) | Intersection Observer API |
| `useKeyboard` | [`useKeyboard.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useKeyboard.js) | Global keyboard shortcut registration |
| `useLanding` | [`useLanding.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useLanding.js) | Landing page data |
| `useProfile` | [`useProfile.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useProfile.js) | User profile mutations |
| `useQuestion` | [`useQuestion.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useQuestion.js) | Single question fetching |
| `useQuestionMutations` | [`useQuestionMutations.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useQuestionMutations.js) | Centralized optimistic mutations |
| `useSearch` | [`useSearch.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useSearch.js) | Debounced search |
| `useToast` | [`useToast.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useToast.js) | Toast context consumer |
| `useTopicDetail` | [`useTopicDetail.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useTopicDetail.js) | Topic detail fetching |
| `useTopics` | [`useTopics.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useTopics.js) | Topics list fetching |

---

## 7. API Layer & Networking

### Axios Client ([`client.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/api/client.js))
- **Axios Instance** — shared instance with base URL and default headers
- **Request Interceptor** — auto-attaches `Authorization: Bearer` token
- **Response Interceptor** — handles 401 errors with automatic retry
- **Token Refresh** — silent refresh with de-duplication (prevents parallel refresh calls)
- **Custom Event Dispatch** — `window.dispatchEvent(new Event('dsa_auth_expired'))` for cross-component auth sync
- **Error Normalization** — consistent error shape across all API calls
- **Convenience API** — `api.get()`, `api.post()`, `api.put()`, `api.patch()`, `api.del()`

### Modular API Layer (13 files in `src/api/`)
- Separate files per domain: `auth`, `bookmarks`, `companies`, `company`, `contact`, `dashboard`, `progress`, `questions`, `search`, `stats`, `topics`, `user`

### Environment-Aware Config ([`config.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/lib/config.js))
- **Dynamic API URL Resolution** — auto-detects LAN IP for mobile testing
- **Vite Environment Variables** — `import.meta.env.VITE_*` pattern
- **Dev/Prod Detection** — `import.meta.env.DEV` / `import.meta.env.PROD`

### Dev Server Proxy
- Vite proxies `/api` to `http://localhost:5000` during development

---

## 8. Authentication & Authorization

- **JWT Token-Based Auth** — Bearer tokens stored in `localStorage`
- **Refresh Token Flow** — silent token refresh on 401 with single-flight de-duplication
- **Google OAuth 2.0** — implicit flow via `@react-oauth/google` + [`GoogleSignInButton`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/ui/GoogleSignInButton.jsx)
- **Route Guards** — `ProtectedRoute` wraps authenticated-only pages
- **Post-Login Redirect** — saves intended destination in `location.state` and redirects after login
- **Auth Expiration Event** — `dsa_auth_expired` custom DOM event syncs logout across components
- **Graceful Degradation** — logout clears local state even if server is unreachable

---

## 9. Styling & Design System

### Architecture
- **Vanilla CSS** — no CSS framework, no CSS-in-JS
- **CSS Custom Properties (Variables)** — extensive design token system
- **CSS Module Pattern** — co-located CSS files per component (e.g., `Modal.jsx` + `Modal.css`)
- **Global Styles** — [`index.css`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/index.css) (13.8kB of base styles)

### Design Tokens ([`tokens.css`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/styles/tokens.css))
- **Spacing Scale** — 4px base, `--space-1` through `--space-24`
- **Typography Scale** — `--font-xs` (11px) through `--font-5xl` (64px)
- **Font Weights** — normal through extrabold
- **Line Heights** — tight, snug, normal, relaxed
- **Shadows** — xs through xl + glow variants (accent, green, yellow, red, purple)
- **Color Palette** — extended semantic colors with dim variants
- **Gradients** — 8 named gradients (hero, card, accent, success, gold, danger, ocean, purple)
- **Z-Index Scale** — organized from `--z-base` (0) to `--z-top` (9999)
- **Animation Tokens** — durations (80ms–600ms) and easing curves (spring, smooth, bounce)
- **Border Radius** — xs through full
- **Responsive Breakpoints** — xs (400px) through xl (1280px)
- **Container Layout** — max-width and responsive padding

### Glassmorphism ([`glass.css`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/styles/glass.css))
- **`backdrop-filter: blur()`** — frosted glass effect with webkit fallback
- **Glass Variants** — base card, elevated (modals), subtle (navbar/pills), overlay, accent, success
- **Gradient Border Card** — `mask-composite: exclude` trick for animated gradient borders
- **Inset Highlights** — top-edge shine effect
- **Frosted Panel** — saturated blur for enhanced glass look

### Typography ([`typography.css`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/styles/typography.css))
- **Google Fonts** — Inter (400, 500, 600, 700)

---

## 10. Animations & Transitions

### CSS Animations ([`animations.css`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/styles/animations.css))
- **Page Entrances** — `fadeInUp`, `fadeInDown`, `fadeInLeft`, `fadeInRight`, `fadeInScale`, `fadeIn`
- **Progress** — `progressFill`, `progressFillH`
- **Loaders** — `spin`, `pulse`, `shimmer`
- **Micro-interactions** — `shake`, `bounce`, `ripple`, `pop`, `checkmark`, `starBurst`
- **Modal** — `slideUp`, `slideDown`, `overlayIn`
- **Toast** — `toastSlideIn`, `toastSlideOut`
- **Ambient** — `float`, `glowPulse`
- **Stagger Delays** — `.stagger-1` through `.stagger-8` (40ms increments)
- **Reduced Motion** — `@media (prefers-reduced-motion: reduce)` disables all animations

### Framer Motion
- **`motion.button`** — spring-based hover/tap micro-animations (GoogleSignInButton)
- **`AnimatePresence`** — enter/exit transitions for dynamically mounted elements
- **Spring Physics** — `type: 'spring', stiffness: 400, damping: 25`

### JavaScript Animations
- **`requestAnimationFrame`** — smooth count-up animation in [`useCountUp`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useCountUp.js)
- **Ease-out Quadratic Easing** — `1 - (1 - progress) * (1 - progress)`
- **`performance.now()`** — high-resolution timing

---

## 11. Accessibility (a11y)

- **Semantic HTML** — `<main>`, `<nav>`, `<footer>`, `<details>`, `<summary>`
- **ARIA Attributes** — `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-label`, `aria-live="polite"`, `aria-hidden`, `role="alert"`, `role="status"`, `role="listbox"`, `role="option"`, `aria-selected`, `aria-autocomplete`
- **Skip to Main Content** — `<a className="skip-to-main" href="#main-content">`
- **Focus Trap** — Modal implements full keyboard focus trapping with Tab/Shift+Tab
- **Focus Management** — auto-focus first focusable element when modal opens
- **Keyboard Navigation** — ESC to close modals, Arrow keys in CommandPalette, Ctrl+K shortcut
- **Reduced Motion Support** — CSS `prefers-reduced-motion` media query
- **ESLint Plugin** — `eslint-plugin-jsx-a11y` for automated accessibility checks

---

## 12. UI Component Library (38 UI components)

### Layout Components
| Component | Concepts |
|---|---|
| [`Navbar`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/layout/Navbar.jsx) | Responsive nav, mobile menu |
| [`Footer`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/layout/Footer.jsx) | Site footer |
| [`BottomNav`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/layout/BottomNav.jsx) | Mobile bottom navigation bar |

### Shared Components
| Component | Concepts |
|---|---|
| [`ErrorBoundary`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/shared/ErrorBoundary.jsx) | React error boundary (class component), `getDerivedStateFromError`, `componentDidCatch` |
| [`ProtectedRoute`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/shared/ProtectedRoute.jsx) | Route guard, redirect with state |
| [`ScrollToTop`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/shared/ScrollToTop.jsx) | Scroll restoration on navigate |
| [`FilterBar`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/shared/FilterBar.jsx) | Reusable filter UI |
| [`Pagination`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/shared/Pagination.jsx) | Page-based pagination |
| [`PeriodTabs`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/shared/PeriodTabs.jsx) | Tab switching |
| [`SearchInput`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/shared/SearchInput.jsx) | Reusable search input |

### UI Primitives
| Component | Key Concepts |
|---|---|
| [`Modal`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/ui/Modal.jsx) | **React Portal** (`createPortal`), focus trap, ESC dismiss, scroll lock, `useId` |
| [`CommandPalette`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/ui/CommandPalette.jsx) | Portal, keyboard nav, debounced search, global shortcut |
| [`Toast`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/ui/Toast.jsx) | Provider pattern, auto-dismiss timers, exit animation, `aria-live` |
| [`AuthModal`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/ui/AuthModal.jsx) | Complex form with multi-step flow |
| [`Dropdown`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/ui/Dropdown.jsx) | Click-outside detection |
| [`ProgressBar`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/ui/ProgressBar.jsx) | CSS-animated progress |
| [`ProgressRing`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/ui/ProgressRing.jsx) | **SVG circle** with `strokeDasharray`/`strokeDashoffset` math |
| [`Skeleton`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/ui/Skeleton.jsx) | Loading placeholder with shimmer |
| [`Spinner`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/ui/Spinner.jsx) | CSS spin animation |
| [`OtpInput`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/ui/OtpInput.jsx) | Multi-field OTP input |
| [`GoogleSignInButton`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/ui/GoogleSignInButton.jsx) | Framer Motion + Google OAuth |
| [`CompanyLogo`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/ui/CompanyLogo.jsx) | Dynamic image loading |
| Various Badges | `DifficultyBadge`, `StatusBadge`, `TierBadge`, `TopicChip` — reusable presentational components |

---

## 13. SEO & Meta

- **Comprehensive Meta Tags** — title, description, keywords, author, robots directives
- **Open Graph** — og:type, og:url, og:title, og:description, og:image (with dimensions and alt text)
- **Twitter Cards** — summary_large_image card type
- **Canonical URL** — `<link rel="canonical">`
- **JSON-LD Structured Data** — `WebSite` schema with `SearchAction` + `WebApplication` schema
- **Language/Locale** — `lang="en"`, `og:locale="en_US"`

---

## 14. PWA & Mobile

- **`theme-color`** — dark theme `#0d1117`
- **`color-scheme: dark`** — signals dark mode to browser
- **Apple Web App** — `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`
- **Mobile Web App Capable** — `mobile-web-app-capable`
- **Apple Touch Icon** — 180×180
- **Responsive Viewport** — `maximum-scale=5.0` (allows zoom)
- **Bottom Navigation** — mobile-only nav bar component

---

## 15. Build & Dev Tooling

### Vite Configuration
- **`@vitejs/plugin-react`** — React Fast Refresh / HMR
- **Path Aliases** — `@`, `@api`, `@components`, `@hooks`, `@pages`, `@lib`, `@styles`, `@context`, `@data`
- **Dev Server Proxy** — `/api` → `http://localhost:5000`
- **Auto-Open Browser** — `open: true`
- **LAN Hosting** — `host: '0.0.0.0'` for mobile testing

### ESLint
- **eslint-plugin-react-hooks** — enforces Rules of Hooks
- **eslint-plugin-react-refresh** — ensures components are HMR-compatible
- **eslint-plugin-jsx-a11y** — accessibility linting

### Deployment
- **Vercel** — with SPA rewrite rules in [`vercel.json`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/vercel.json)
- **Environment Files** — `.env` (dev) and `.env.production`

---

## 16. Architecture Patterns

### Project Structure (Feature-Based)
```
src/
├── api/          ← 13 files, one per API domain
├── components/
│   ├── layout/   ← Navbar, Footer, BottomNav
│   ├── shared/   ← ErrorBoundary, ProtectedRoute, FilterBar, Pagination
│   └── ui/       ← 19 reusable UI primitives
├── context/      ← AuthContext, ToastContext
├── data/         ← Static data (company classifications, domains)
├── hooks/        ← 18 custom hooks
├── lib/          ← config, queryClient, queryKeys
├── pages/        ← 16 page components (lazy-loaded)
└── styles/       ← Design tokens, glass, animations, typography
```

### Key Patterns
| Pattern | Example |
|---|---|
| **Separation of Concerns** | Hooks handle logic, components handle UI, API layer handles networking |
| **Custom Hook Abstraction** | Every page has a dedicated hook (e.g., `useLanding`, `useDashboard`) |
| **Provider Pattern** | `AuthProvider`, `ToastProvider`, `QueryClientProvider`, `GoogleOAuthProvider` |
| **Portal Pattern** | Modal and CommandPalette render into `document.body` |
| **Optimistic UI** | Bookmarks and status changes update the cache before the server responds |
| **Interceptor Pattern** | Axios request/response interceptors for auth and error handling |
| **Query Key Factory** | Centralized key generation for cache management |
| **Singleton Pattern** | Single `queryClient` instance shared across the app |
| **Observer Pattern** | Custom DOM events (`dsa_auth_expired`) for cross-component communication |
| **Guard Pattern** | `ProtectedRoute` prevents unauthenticated access |
| **Co-location** | Each component's CSS file lives next to its JSX file |

---

## 17. Browser APIs Used

| API | Where | Purpose |
|---|---|---|
| `localStorage` | AuthContext, API client | Token persistence |
| `IntersectionObserver` | useIntersection | Scroll-triggered animations |
| `requestAnimationFrame` | useCountUp | Smooth number animations |
| `performance.now()` | useCountUp | High-res timing |
| `createPortal` | Modal, CommandPalette | Render outside component tree |
| `CustomEvent / dispatchEvent` | API client | Auth expiration notification |
| `window.addEventListener` | useKeyboard, AuthContext | Global keyboard shortcuts, auth events |
| `document.body.style.overflow` | Modal | Prevent background scrolling |
| `document.querySelectorAll` | Modal | Focus trap implementation |

---

## Summary Stats

| Metric | Count |
|---|---|
| **Pages** | 16 (all lazy-loaded) |
| **Components** | 38+ (layout + shared + UI) |
| **Custom Hooks** | 18 |
| **API Modules** | 13 |
| **CSS Files** | 25+ |
| **Design Tokens** | 80+ CSS custom properties |
| **CSS Keyframe Animations** | 20 |
| **Total Frontend LOC** | ~6,000+ (JSX) + ~5,000+ (CSS) |
