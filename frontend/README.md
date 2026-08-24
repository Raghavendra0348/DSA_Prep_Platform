
# 🎨 DSA Prep Platform — Frontend Documentation

This directory contains the React 18 + Vite single-page application (SPA) for the **DSA Prep Platform**.

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
```

---

## 🏗️ Tech Stack

* **React 18**: UI Component Tree & Hooks
* **Vite 6**: Lightning-fast dev server with HMR & Rollup production bundler
* **React Router v7**: Single Page Application Routing
* **Lucide React**: Modern iconography
* **Vanilla CSS3**: Design system tokens, glassmorphism, responsive flex/grid layouts
* **Fetch API Wrapper**: Modular client with JWT Bearer header injection (`src/api/client.js`)

---

## 📂 Core Architecture

```micro
src/
├── api/          # Modular API request handlers (auth, companies, topics, progress, bookmarks)
├── components/   # Reusable UI widgets & Layout components (Navbar, Badges, SearchInput, Pagination)
├── context/      # AuthContext provider (JWT state & profile synchronization)
├── hooks/        # Custom React hooks (useAuth)
├── pages/        # Main application pages (Landing, Dashboard, Companies, Topics, Detail Views)
└── styles/       # Design tokens & CSS resets
```

---

## 🌟 Key Features

* **4-Tier Company Explorer**: Filter 429+ tech companies by type (Product vs Service) and Tiers (FAANG+, Product Unicorns, MNCs, Other Tech).
* **10-Phase DSA Learning Roadmap**: Topics organized into a structured 10-phase sequence with specific learning rules for interview prep.
* **Topic & Company Question Detail Views**: High-density problem tables featuring interactive status badges, difficulty pills, and direct LeetCode SVG links.
* **Real-time Optimistic State Updates**: Problem status and bookmark toggles update immediately on UI with background server sync.
* **Dark Glassmorphism Design System**: Modern aesthetic with glowing borders, hover micro-interactions, and custom favicon.

*For complete end-to-end frontend architecture details, see [`../FRONTEND.md`](../FRONTEND.md).*
