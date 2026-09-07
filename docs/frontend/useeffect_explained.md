# useEffect Hook — Comprehensive Guide & Project Implementation

This document provides an in-depth explanation of React's `useEffect` hook: how it works under the hood, mental models, execution lifecycle, best practices, and **exact real-world implementations across this project**.

---

## Table of Contents

1. [What is `useEffect`?](#1-what-is-useeffect)
2. [How `useEffect` Works Internally](#2-how-useeffect-works-internally)
3. [The Three Dependency Array Variations](#3-the-three-dependency-array-variations)
4. [The Cleanup Function: Why and When It Runs](#4-the-cleanup-function-why-and-when-it-runs)
5. [Architecture in this Project: `useEffect` vs TanStack Query](#5-architecture-in-this-project-useeffect-vs-tanstack-query)
6. [Real-World Patterns &amp; Code Examples in this Project](#6-real-world-patterns--code-examples-in-this-project)
   - [Pattern 1: Event Listeners &amp; Global Shortcuts](#pattern-1-event-listeners--global-shortcuts)
   - [Pattern 2: Timers, Intervals &amp; Animations](#pattern-2-timers-intervals--animations)
   - [Pattern 3: Synchronizing with Browser / DOM APIs](#pattern-3-synchronizing-with-browser--dom-apis)
   - [Pattern 4: Pub/Sub &amp; Custom Window Events](#pattern-4-pubsub--custom-window-events)
   - [Pattern 5: State Synchronization &amp; Navigation Triggers](#pattern-5-state-synchronization--navigation-triggers)
7. [Common Pitfalls &amp; How this Project Avoids Them](#7-common-pitfalls--how-this-project-avoids-them)
8. [Inventory of All `useEffect` Usages in the Codebase](#8-inventory-of-all-useeffect-usages-in-the-codebase)

---

## 1. What is `useEffect`?

React components are supposed to be **pure functions** during the render phase: given the same `props` and `state`, they should return JSX without altering anything outside the component (no DOM mutations, no network requests, no setting timers, no subscribing to events).

Any operation that affects something outside the scope of the currently rendering component is called a **Side Effect**.

`useEffect` is a React Hook that lets you synchronize a component with an **external system** (the browser DOM, window events, network sockets, timers, or third-party libraries).

### Syntax

```javascript
useEffect(() => {
  // 1. Setup code (runs after the component renders)

  return () => {
    // 2. Optional cleanup code (runs before effect re-runs, or on unmount)
  };
}, [dependencies]); // 3. Dependency array
```

---

## 2. How `useEffect` Works Internally

### The Render vs Effect Lifecycle

In React, updating a component involves three phases:

```text
┌────────────────────────────────────────────────────────┐
│ 1. TRIGGER & RENDER PHASE (Pure)                       │
│    - React calls your component function               │
│    - Calculates what JSX needs to change               │
│    - MUST BE PURE: NO SIDE EFFECTS HERE                │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 2. COMMIT PHASE                                        │
│    - React applies changes to the actual DOM           │
│    - The browser repaints the screen (pixels rendered) │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ 3. PASSIVE EFFECT PHASE (`useEffect`)                  │
│    - Runs ASYNCHRONOUSLY AFTER browser paint           │
│    - Executes previous cleanup (if any)                │
│    - Executes new effect setup function                │
└────────────────────────────────────────────────────────┘
```

> [!NOTE]
> Unlike `useLayoutEffect` (which runs synchronously before the browser paints and blocks the screen), `useEffect` is **deferred until after the browser paints**. This ensures effects like logging, subscriptions, and timers do not block the user interface from appearing smoothly.

---

## 3. The Three Dependency Array Variations

The second argument to `useEffect` controls **when** the effect re-executes. React compares dependencies using `Object.is` (shallow comparison).

### Case 1: No Dependency Array (Run on Every Render)

```javascript
useEffect(() => {
  console.log('Runs on EVERY single render');
});
```

- **When it runs:** Initial mount + after every re-render (state or prop change).
- **When to use:** Extremely rare (e.g., logging every render). Usually an anti-pattern or accidental omission.

### Case 2: Empty Dependency Array `[]` (Run Once on Mount)

```javascript
useEffect(() => {
  console.log('Runs ONCE after the first mount');
  return () => console.log('Runs ONCE on unmount');
}, []);
```

- **When it runs:** Only after the initial paint, never on re-renders.
- **When to use:** Setting up global event listeners, page titles, or one-time subscriptions that do not depend on props or state.

### Case 3: With Dependencies `[a, b]` (Run on Change)

```javascript
useEffect(() => {
  console.log(`Runs on mount and whenever 'a' or 'b' changes: ${a}, ${b}`);
}, [a, b]);
```

- **When it runs:** Initial mount + whenever any variable in the array changes from the previous render.
- **When to use:** Syncing state, debouncing search inputs, timers that restart on value change.

---

## 4. The Cleanup Function: Why and When It Runs

If your effect returns a function, React treats it as a **cleanup function**.

```javascript
useEffect(() => {
  const handler = () => console.log('Clicked');
  window.addEventListener('click', handler);

  // CLEANUP FUNCTION
  return () => {
    window.removeEventListener('click', handler);
  };
}, []);
```

### When does cleanup run?

1. **Before the effect runs again:** If dependencies change, React runs the previous effect's cleanup first, ensuring the old state/listeners are cleaned up before running the new effect.
2. **On Component Unmount:** When the component is removed from the DOM, React runs the cleanup function to prevent memory leaks and dangling handlers.

> [!IMPORTANT]
> If you add an event listener or start a `setInterval`/`setTimeout` in an effect without returning a cleanup function, that listener or interval will stay active forever in memory, even after the user leaves the page!

---

## 5. Architecture in this Project: `useEffect` vs TanStack Query

A common mistake in React applications is using `useEffect` for data fetching:

```javascript
// ❌ ANTI-PATTERN in modern React:
useEffect(() => {
  let ignore = false;
  setLoading(true);
  fetch('/api/data')
    .then(res => res.json())
    .then(data => { if (!ignore) setData(data); });
  return () => { ignore = true; };
}, [id]);
```

### Why this project avoids `useEffect` for data fetching

In this codebase, all API data fetching is managed using **TanStack React Query** (`@tanstack/react-query`). For example:

- [`useDashboard.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useDashboard.js) uses `useQuery`
- [`useTopicDetail.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useTopicDetail.js) uses `useQuery`
- [`useBookmarks.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useBookmarks.js) uses `useQuery` and `useMutation`
- [`useCompany.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useCompany.js) uses `useQuery`

TanStack Query automatically solves race conditions, caching, retries, window refocus re-fetching, deduplication, and stale times.

### What `useEffect` is actually used for here

In this project, `useEffect` is strictly reserved for its intended React purpose: **synchronizing with non-React external systems**:

1. **DOM Events & Outside Clicks** (attaching/detaching `mousedown`, `keydown`, `touchstart`)
2. **Timers & Animation Loops** (`setTimeout`, `setInterval`, `requestAnimationFrame`)
3. **Browser Window APIs** (`document.title`, `document.body.style.overflow`, `IntersectionObserver`)
4. **App-wide Custom Event Bus** (`dsa_auth_expired` event listener)
5. **Local state synchronization** (initializing note text fields from server data when question changes)

---

## 6. Real-World Patterns & Code Examples in this Project

---

### Pattern 1: Event Listeners & Global Shortcuts

#### 1. Outside Click Detection — [`useClickOutside.js`](file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useClickOutside.js#L17-L44)

Detects when a user clicks outside one or more monitored elements:

```javascript
export function useClickOutside(refs, handler, enabled = true) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const refsRef = useRef(refs);
  refsRef.current = refs;

  useEffect(() => {
    if (!enabled) return;

    function listener(event) {
      const currentRefs = refsRef.current;
      const refList = Array.isArray(currentRefs) ? currentRefs : [currentRefs];

      // If click/touch was inside ANY of the provided refs, ignore
      const clickedInside = refList.some(r => r?.current && r.current.contains(event.target));
      if (!clickedInside) {
        handlerRef.current?.(event);
      }
    }

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [enabled]);
}
```

**Why cleanup is crucial:** If the dropdown closes and the component unmounts, failing to remove `mousedown` would keep executing `handler` on every click anywhere in the app.

#### 2. Global Keyboard Shortcuts — [`useKeyboard.js`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useKeyboard.js#L11-L34>)

Registers custom keyboard hotkeys (such as `Cmd+K`, `Escape`, `?`):

```javascript
export function useKeyboard(key, handler, modifiers = {}) {
  const { ctrl = false, meta = false, shift = false, alt = false, ctrlOrMeta = false } = modifiers;

  useEffect(() => {
    if (!handler) return;

    function onKeyDown(e) {
      if (ctrl && !e.ctrlKey) return;
      if (meta && !e.metaKey) return;
      if (shift && !e.shiftKey) return;
      if (alt && !e.altKey) return;
      if (ctrlOrMeta && !(e.ctrlKey || e.metaKey)) return;

      if (e.key === key) {
        handler(e);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, handler, ctrl, meta, shift, alt, ctrlOrMeta]);
}
```

#### 3. Quick Search Focus Hotkey — [`Search.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/Search.jsx#L249-L265>)

Pressing `/` from anywhere on the search page immediately focuses the search input bar:

```javascript
useEffect(() => {
  const handleGlobalKeyDown = (e) => {
    const activeTag = document.activeElement?.tagName?.toLowerCase();
    const isInputActive = activeTag === 'input' || activeTag === 'textarea';

    // Press '/' to focus search field from anywhere unless already typing
    if (e.key === '/' && !isInputActive) {
      e.preventDefault();
      inputRef.current?.focus();
      return;
    }
  };

  window.addEventListener('keydown', handleGlobalKeyDown);
  return () => window.removeEventListener('keydown', handleGlobalKeyDown);
}, []);
```

---

### Pattern 2: Timers, Intervals & Animations

#### 1. Search Query Debounce — [`useDebounce.js`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useDebounce.js#L11-L20>)

Waits for the user to pause typing before triggering expensive search filtering:

```javascript
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set a timer to update debounced value after delay ms
    const timer = setTimeout(() => setDebouncedValue(value), delay);

    // Cleanup: cancels timer if value changes before delay finishes
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

**How it works:** If the user types 5 letters in 200ms, each keystroke triggers a re-render. `useEffect` cleans up the previous `setTimeout` via `clearTimeout(timer)` before starting a new one. Only the final keystroke survives and updates `debouncedValue`.

#### 2. OTP Expiry and Resend Cooldown Countdown — [`Register.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/Register.jsx#L71-L87>)

Tickers that decrement remaining seconds every 1000ms:

```javascript
// Resend cooldown countdown ticker
useEffect(() => {
  if (step !== 2 || resendCooldown <= 0) return;

  const timer = setInterval(() => {
    // Functional state update avoids stale closures
    setResendCooldown(prev => Math.max(0, prev - 1));
  }, 1000);

  return () => clearInterval(timer);
}, [step, resendCooldown]);
```

**Notice the functional update:** `setResendCooldown(prev => Math.max(0, prev - 1))` is used rather than `setResendCooldown(resendCooldown - 1)`, guaranteeing the timer always operates on fresh state.

#### 3. Smooth 60fps Number Count Animation — [`useCountUp.js`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useCountUp.js#L12-L35>)

Uses browser `requestAnimationFrame` for hardware-accelerated animations:

```javascript
export function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (typeof target !== 'number' || isNaN(target)) return;

    const start = performance.now();

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out quadratic formula
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(Math.round(eased * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    // Cancel animation frame if unmounted or target changes mid-flight
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}
```

---

### Pattern 3: Synchronizing with Browser / DOM APIs

#### 1. Dynamic Page Titles

Components update `document.title` so browser tabs show meaningful titles:

- [`Dashboard.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/Dashboard.jsx#L131-L133>):
  ```javascript
  useEffect(() => {
    document.title = 'Dashboard — DSA Prep';
  }, []);
  ```
- [`TopicDetail.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/TopicDetail.jsx#L42-L44>):
  ```javascript
  useEffect(() => {
    document.title = `${topicName} — DSA Prep`;
  }, [topicName]);
  ```
- [`Search.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/Search.jsx#L207-L209>):
  ```javascript
  useEffect(() => {
    document.title = query.trim()
      ? `Search: "${query.trim()}" — DSA Prep`
      : 'Search Problems, Topics & Companies — DSA Prep';
  }, [query]);
  ```

#### 2. Body Scroll Locking — [`Modal.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/ui/Modal.jsx#L23-L30>) & [`Navbar.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/layout/Navbar.jsx#L71-L80>)

Prevents background page scrolling while a modal or mobile drawer is open:

```javascript
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }

  // Cleanup: always restore scrolling if modal unmounts unexpectedly
  return () => {
    document.body.style.overflow = '';
  };
}, [isOpen]);
```

#### 3. Viewport Intersection Observer — [`useIntersection.js`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useIntersection.js#L15-L30>)

Observes when an element enters the visible viewport (used on the landing page for scroll-triggered stats counters):

```javascript
export function useIntersection(options = {}, once = true) {
  const ref = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true);
        if (once) observer.unobserve(element);
      } else if (!once) {
        setIsIntersecting(false);
      }
    }, { threshold: 0.15, ...options });

    observer.observe(element);

    // Disconnect observer on unmount
    return () => observer.unobserve(element);
  }, [once]);

  return [ref, isIntersecting];
}
```

---

### Pattern 4: Pub/Sub & Custom Window Events

#### Session Expiration Synchronization — [`AuthContext.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/context/AuthContext.jsx#L32-L42>)

When an API request receives a 401 and refresh token fails, the Axios interceptor dispatches a custom browser event `dsa_auth_expired`. The `AuthContext` listens to this event using `useEffect` and cleans up state:

```javascript
useEffect(() => {
  const handleAuthExpired = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('dsa_token');
    localStorage.removeItem('dsa_refresh_token');
    localStorage.removeItem('dsa_user');
  };

  window.addEventListener('dsa_auth_expired', handleAuthExpired);
  return () => window.removeEventListener('dsa_auth_expired', handleAuthExpired);
}, []);
```

**Why this is effective:** It allows non-React API utilities (like Axios interceptors outside the React tree) to notify the React state tree cleanly without passing dispatchers around.

---

### Pattern 5: State Synchronization & Navigation Triggers

#### 1. Seeding Form State from Server Query — [`useQuestion.js`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useQuestion.js#L29-L37>)

When loading a question detail page, editable notes must be populated once the query completes or when navigating to another question:

```javascript
// Seed notes from server once on first load (useEffect — not during render)
useEffect(() => {
  if (data) {
    setNotes(data.userNote ?? data.notes ?? '');
    setNotesInit(true);
  }
  // Only re-seed if the question itself changes (navigate to a different slug)
}, [data?.id]);
```

**Why not during render?** Setting state directly during render causes infinite re-renders (`Cannot update a component while rendering a different component`). `useEffect` ensures state update occurs after render.

#### 2. Auth Guard Navigation — [`Login.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/Login.jsx#L48-L50>)

If the user is already authenticated, redirect them away from login/registration pages:

```javascript
useEffect(() => {
  if (user) navigate('/companies', { replace: true });
}, [user, navigate]);
```

#### 3. Route-change Menu Reset — [`BottomNav.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/layout/BottomNav.jsx#L69-L71>)

Closes open dropdowns whenever the URL changes:

```javascript
useEffect(() => {
  setProfileMenuOpen(false);
}, [location.pathname]);
```

---

## 7. Common Pitfalls & How this Project Avoids Them

| Pitfall                             | Problem                                                                            | How this Project Solves It                                                                                                                                                                              |
| ----------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Missing Cleanup**           | Event listeners or intervals linger in memory across page switches.                | Every event listener in`useClickOutside`, `useKeyboard`, `Navbar`, and `Modal` returns a cleanup function removing the listener.                                                                |
| **Stale Closures in Timers**  | `setVal(val + 1)` inside `setInterval` reads initial render's `val` forever. | Uses functional updates:`setResendCooldown(prev => Math.max(0, prev - 1))` in [`Register.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/Register.jsx#L75>). |
| **Infinite Re-render Loops**  | Calling`setState` inside `useEffect` without proper dependencies.              | Explicit dependency arrays; objects/arrays are memoized or primitives (like`data?.id` or `location.pathname`) are used.                                                                             |
| **Fetching in `useEffect`** | Race conditions, caching bugs, manual loading/error flags.                         | Replaced by TanStack Query (`useQuery` / `useMutation`) throughout the entire application.                                                                                                          |
| **Blocking Scroll On Crash**  | If modal closes unexpectedly, body overflow might remain locked.                   | Cleanup function`return () => { document.body.style.overflow = ''; }` runs unconditionally when unmounted.                                                                                            |

---

## 8. Inventory of All `useEffect` Usages in the Codebase

| File                                                                                                                                     | Lines                        | Dependencies                                                      | Purpose                                      |                Cleanup Provided?                |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------- | -------------------------------------------- | :----------------------------------------------: |
| [`useClickOutside.js`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useClickOutside.js#L9-L24>)    | 9–24                        | `[ref, handler]`                                                | Listen to outside click/tap                  |          Yes (`removeEventListener`)          |
| [`useDebounce.js`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useDebounce.js#L14-L18>)           | 14–18                       | `[value, delay]`                                                | Debounce input changes                       |              Yes (`clearTimeout`)              |
| [`useKeyboard.js`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useKeyboard.js#L14-L33>)           | 14–33                       | `[key, handler, ...modifiers]`                                  | Global hotkey listener                       |          Yes (`removeEventListener`)          |
| [`useIntersection.js`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useIntersection.js#L15-L30>)   | 15–30                       | `[once]`                                                        | IntersectionObserver trigger                 |           Yes (`observer.unobserve`)           |
| [`useCountUp.js`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useCountUp.js#L12-L34>)             | 12–34                       | `[target, duration]`                                            | 60fps number animation                       |          Yes (`cancelAnimationFrame`)          |
| [`useQuestion.js`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/hooks/useQuestion.js#L30-L37>)           | 30–37                       | `[data?.id]`                                                    | Seed notes when question ID changes          |             No (one-shot state sync)             |
| [`AuthContext.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/context/AuthContext.jsx#L32-L42>)       | 32–42                       | `[]`                                                            | Listen to`dsa_auth_expired`                |          Yes (`removeEventListener`)          |
| [`Modal.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/ui/Modal.jsx#L23-L42>)             | 23–30, 33–42               | `[isOpen]`                                                      | Scroll lock & auto-focus first input         |    Yes (`overflow = ''`, `clearTimeout`)    |
| [`Navbar.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/layout/Navbar.jsx#L37-L80>)       | 37–48, 51–68, 71–80       | `[]`, `[menuOpen]`                                            | Click outside, Cmd+K hotkey, scroll lock     | Yes (`removeEventListener`, `overflow = ''`) |
| [`BottomNav.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/layout/BottomNav.jsx#L69-L85>) | 69–71, 74–85               | `[pathname]`, `[profileMenuOpen]`                             | Reset menu on route, outside click           |          Yes (`removeEventListener`)          |
| [`Toast.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/components/ui/Toast.jsx#L101-L109>)           | 101–109                     | `[paused]`                                                      | Pause/resume auto-dismiss on hover           |             No (state/ref tracking)             |
| [`Search.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/Search.jsx#L207-L260>)                 | 207–209, 212–219, 249–265 | `[query]`, `[]`                                               | Document title, recent search save,`/` key | Yes (`clearTimeout`, `removeEventListener`) |
| [`Register.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/Register.jsx#L63-L87>)               | 63–87                       | `[user]`, `[step]`, `[resendCooldown]`, `[expirySeconds]` | Auth redirect, title sync, OTP countdowns    |             Yes (`clearInterval`)             |
| [`Login.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/Login.jsx#L48-L54>)                     | 48–50, 52–54               | `[user, navigate]`, `[]`                                      | Auth redirect, page title                    |          No (one-shot navigation/title)          |
| [`Landing.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/Landing.jsx#L25-L27,L318-L334>)       | 25–27, 318–334             | `[]`, `[visible, value]`                                      | Title sync, animated counter ticker          |             Yes (`clearInterval`)             |
| [`Dashboard.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/Dashboard.jsx#L131-L133>)           | 131–133                     | `[]`                                                            | Document title                               |              No (simple title set)              |
| [`TopicDetail.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/TopicDetail.jsx#L42-L44>)         | 42–44                       | `[topicName]`                                                   | Document title                               |              No (simple title set)              |
| [`Bookmarks.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/Bookmarks.jsx#L16>)                 | 16                           | `[]`                                                            | Document title                               |              No (simple title set)              |
| [`Topics.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/Topics.jsx#L54-L56>)                   | 54–56                       | `[]`                                                            | Document title                               |              No (simple title set)              |
| [`Companies.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/Companies.jsx#L53-L55>)             | 53–55                       | `[]`                                                            | Document title                               |              No (simple title set)              |
| [`Profile.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/Profile.jsx#L34-L41>)                 | 34–36, 39–41               | `[]`                                                            | Document title                               |              No (simple title set)              |
| [`About.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/About.jsx#L10>)                         | 10                           | `[]`                                                            | Document title                               |              No (simple title set)              |
| [`Terms.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/Terms.jsx#L7>)                          | 7                            | `[]`                                                            | Document title                               |              No (simple title set)              |
| [`Privacy.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/Privacy.jsx#L7>)                      | 7                            | `[]`                                                            | Document title                               |              No (simple title set)              |
| [`Contact.jsx`](<file:///home/a-raghavendra/Desktop/github_repos/Project%20DSA/frontend/src/pages/Contact.jsx#L59>)                     | 59                           | `[]`                                                            | Document title                               |              No (simple title set)              |
