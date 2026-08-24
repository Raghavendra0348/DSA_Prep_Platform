
# 🎨 DSA Prep Platform — Frontend

React 19 + Vite 5 single-page application for the **DSA Prep Platform**.

---

## ⚡ Quick Start

```bash
# Install dependencies
npm install

# Start local development server (runs on http://localhost:5173)
npm run dev

# Build production bundle (outputs to ./dist)
npm run build

# Preview build locally
npm run preview

# Run ESLint
npm run lint
```

---

## 🏗️ Tech Stack

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **React** | 19 | UI component tree & hooks |
| **Vite** | 5 | Dev server with HMR + Rollup bundler |
| **React Router** | v7 | SPA routing with `React.lazy` code-splitting |
| **TanStack Query** | v5 | Server-state caching, background refetching, optimistic UI |
| **Axios** | 1.x | HTTP client with JWT interceptors & silent token refresh |
| **Framer Motion** | 13 | Page transitions & micro-animations |
| **Lucide React** | 1.x | Modern SVG icon library |
| **Vanilla CSS** | — | Design tokens, glassmorphism, responsive flex/grid layouts |

---

## 📂 Source Architecture

```
src/
├── main.jsx              # Entry: QueryClientProvider + App mount
├── App.jsx               # Root: BrowserRouter, AuthProvider, Layout, Routes
├── index.css             # Global styles & CSS reset
│
├── api/                  # API modules (one per resource)
│   ├── client.js         # Axios instance with Bearer token injection + 401 auto-refresh
│   ├── auth.js           # Login, register, logout
│   ├── companies.js      # Company list
│   ├── company.js        # Company detail + stats
│   ├── questions.js      # Question detail
│   ├── search.js         # Global search
│   ├── topics.js         # Topics listing & detail
│   ├── progress.js       # Progress CRUD + bulk fetch
│   ├── bookmarks.js      # Bookmark add/remove/list
│   ├── dashboard.js      # Dashboard analytics
│   ├── user.js           # Profile & password
│   ├── stats.js          # Platform stats
│   └── contact.js        # Contact form
│
├── hooks/                # 20 custom React hooks
│   ├── useAuth.js        # AuthContext consumer shortcut
│   ├── useCompanies.js   # Companies list (TanStack Query)
│   ├── useCompany.js     # Company detail + status/bookmark mutations
│   ├── useBookmarks.js   # Bookmarks with client-side filtering
│   ├── useDashboard.js   # Dashboard data + manual refresh
│   ├── useTopics.js      # Topics listing
│   ├── useTopicDetail.js # Topic detail with questions + progress
│   ├── useQuestion.js    # Question detail + notes + mutations
│   ├── useSearch.js      # Debounced search
│   ├── useProfile.js     # Profile update + password change
│   ├── useLanding.js     # Landing page parallel data fetching
│   ├── useCountUp.js     # Animated counter hook
│   ├── useDebounce.js    # Value debounce
│   ├── useKeyboard.js    # Keyboard shortcut handler
│   ├── useClickOutside.js# Outside click detection
│   ├── useIntersection.js# IntersectionObserver hook
│   ├── useMediaQuery.js  # Responsive breakpoint hook
│   ├── useLocalStorage.js# Persistent state
│   ├── useToast.js       # Toast notification consumer
│   └── useQuestionMutations.js  # Shared status/bookmark mutations
│
├── components/
│   ├── layout/           # Navbar, Footer
│   ├── shared/           # ProtectedRoute, ErrorBoundary, ScrollToTop,
│   │                     # Pagination, FilterBar, PeriodTabs, SearchInput
│   └── ui/               # 18+ reusable components:
│                         # AuthModal, BookmarkBtn, CommandPalette, CompanyLogo,
│                         # DifficultyBadge, Dropdown, EmptyState, FrequencyBar,
│                         # LeetCodeIcon, Modal, ProgressBar, ProgressRing,
│                         # Skeleton, Spinner, StatCard, StatusBadge, TierBadge,
│                         # Toast, TopicChip, SocialIcons
│
├── context/
│   └── AuthContext.jsx   # Global auth state: user, token, login(), logout(), updateUser()
│
├── pages/                # 16 lazy-loaded page components
│   ├── Landing.jsx       # Hero search, stats, featured companies
│   ├── Companies.jsx     # Tier-grouped company directory
│   ├── CompanyDetail.jsx # Problem workspace with period/difficulty filters
│   ├── QuestionDetail.jsx# Problem info, companies, notes, progress
│   ├── Topics.jsx        # 10-phase DSA roadmap + topic cards
│   ├── TopicDetail.jsx   # Questions under a topic
│   ├── Search.jsx        # Full-text search page
│   ├── Dashboard.jsx     # Personal analytics (protected)
│   ├── Bookmarks.jsx     # Saved problems (protected)
│   ├── Profile.jsx       # Account settings (protected)
│   ├── Login.jsx         # Login form
│   ├── Register.jsx      # Registration form
│   ├── About.jsx         # About page
│   ├── Contact.jsx       # Contact form
│   ├── Privacy.jsx       # Privacy policy
│   ├── Terms.jsx         # Terms of service
│   └── NotFound.jsx      # 404 page
│
├── data/                 # Static data files
│   ├── companyClassification.js  # Tier/type classification + helper functions
│   └── companyDomains.js         # Company logo URL mappings
│
└── styles/
    └── tokens.css        # CSS custom properties (design tokens)
```

---

## 🌟 Key Features

- **4-Tier Company Explorer**: Browse 429+ companies classified as FAANG+ (Tier 1), Product Unicorns (Tier 2), High-Growth Startups (Tier 3), or Service & IT (Tier 4), filterable by Product-Based vs. Service-Based type.

- **10-Phase DSA Learning Roadmap**: Topics organized into a structured 10-phase learning sequence with mastery rules and difficulty progression.

- **Interactive Problem Tables**: Company question lists with clickable status badges (Not Started → Attempted → Solved), 1-click bookmarking, frequency bars, and direct LeetCode links.

- **Optimistic UI Updates**: Status toggles and bookmark actions reflect instantly in the UI. TanStack Query handles background server sync and automatic cache invalidation.

- **Global Command Palette**: `Ctrl+K` / `Cmd+K` opens a real-time search modal with keyboard navigation across questions, topics, and companies.

- **Silent Token Refresh**: Axios interceptors automatically detect expired JWTs, refresh them via the backend, and retry failed requests — zero user disruption.

- **Dark Glassmorphism Design**: Modern dark theme with glowing borders, backdrop blur, subtle gradients, hover micro-animations, and Framer Motion page transitions.

- **Fully Responsive**: Adapts from desktop to mobile with CSS Grid, Flexbox, and media query hooks.

---

## 🔧 Configuration

### Environment Variables

| File | Variable | Default | Description |
| :--- | :--- | :--- | :--- |
| `.env` | `VITE_API_URL` | `http://localhost:5000` | Backend API base URL |
| `.env.production` | `VITE_API_URL` | `https://dsa-prep-backend.onrender.com` | Production API URL |

### Deployment

The frontend deploys to **Vercel** as a static SPA. The [`vercel.json`](vercel.json) file includes rewrite rules to handle client-side routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

*For the full project README, see [`../README.md`](../README.md). For backend architecture, see [`../docs/`](../docs/).*
