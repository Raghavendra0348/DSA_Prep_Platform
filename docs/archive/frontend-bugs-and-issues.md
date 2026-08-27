# Frontend Bugs and Issues

**Audit date:** 2026-08-20  
**Scope:** `frontend/src` and the frontend integration points it calls in `backend/src/routes`.  
**Method:** static code/API-contract review plus `npm run lint` and `npm run build`.

This is the complete list of issues identified in this audit. It is intentionally split between confirmed defects and lower-priority quality/accessibility concerns; it is not a claim that a manual test session against a running API has exercised every possible data combination.

## Verification summary

| Check | Result |
| --- | --- |
| `npm run lint` | **Failed:** 13 errors and 1 warning |
| `npm run build` | **Passed:** Vite production build completed in 21.35 s |
| Browser smoke test | Not run: the sandbox cannot bind `127.0.0.1:5173` (`EPERM`) |

## Critical and high-priority defects

| ID | Area | Issue and impact | Evidence | Recommended fix |
| --- | --- | --- | --- | --- |
| FE-01 | Topic detail | Topic responses contain `questions` and a top-level `total`, but the page reads `data.pagination`. As a result, the page never receives `totalPages`; only the first 50 questions are reachable and the banner falls back to “DSA Topic” instead of showing the count. | [TopicDetail.jsx](src/pages/TopicDetail.jsx#L49-L55); `backend/src/routes/topics.js` returns `{ total, questions }`. | Make the API return a `pagination` object, or derive it in the frontend from `data.total`, `page`, and `limit`. |
| FE-02 | Topic detail | The multi-select difficulty UI sends comma-separated values such as `EASY,MEDIUM`, while the topic endpoint applies that string directly as one Prisma enum value. Selecting more than one difficulty therefore fails instead of filtering. | [TopicDetail.jsx](src/pages/TopicDetail.jsx#L49-L52); `backend/src/routes/topics.js` uses `{ difficulty }` without splitting it. | Define a shared contract: send one value only, or have the backend split and use `in`. |
| FE-03 | Topic detail / authentication | The topic endpoint has no optional-auth enrichment, but the page renders status and bookmark controls from response fields. On every initial load these fields are absent, so a signed-in user sees all topic questions as unstarted and unbookmarked. | [TopicDetail.jsx](src/pages/TopicDetail.jsx#L87-L98); compare `backend/src/routes/topics.js` with the authenticated enrichment in `backend/src/routes/company.js`. | Add authenticated progress/bookmark enrichment to the topic endpoint or fetch progress/bookmarks in a single client-side batch request. |
| FE-04 | Question notes | Notes are neither returned by `GET /api/questions/:slug` nor safely saved for a question without an existing progress row. The detail page initializes notes from a field the endpoint does not provide, and the notes PATCH route uses an update operation. Users can lose visibility of saved notes and cannot save the first note unless they have first created progress. | [QuestionDetail.jsx](src/pages/QuestionDetail.jsx#L31-L34), [QuestionDetail.jsx](src/pages/QuestionDetail.jsx#L64-L75); `backend/src/routes/questions.js` selects status only, and `backend/src/routes/progress.js` updates an existing record. | Return `notes` for the signed-in user and implement note upsert (or create progress before saving). Show a visible save error. |
| FE-05 | Contact form | The contact form never submits to an API or email service. It waits 800 ms and announces that the team received the message, which is false and silently discards the user’s message. | [Contact.jsx](src/pages/Contact.jsx#L68-L81) | Integrate a real, authenticated endpoint/service with success and error states, or label the form as unavailable and remove the success claim. |
| FE-06 | Session expiry | A failed token refresh clears `localStorage`, but it cannot clear `AuthProvider`’s in-memory `user` and `token`. The UI and protected-route check continue to treat the session as logged in until a reload, while requests fail. | [client.js](src/api/client.js#L41-L47); [AuthContext.jsx](src/context/AuthContext.jsx#L7-L25), [AuthContext.jsx](src/context/AuthContext.jsx#L62-L64) | Centralize session clearing in the auth provider and notify it from the API client (or use a shared store/event), then redirect to login. |
| FE-07 | Password change | The backend revokes all refresh tokens after a password change, but the frontend reports success and leaves the user in the current session. The next refresh fails unexpectedly; the backend’s own response says to log in again. | [Profile.jsx](src/pages/Profile.jsx#L97-L106); `backend/src/routes/user.js` revokes tokens after password change. | Immediately call local logout and navigate to Login after a successful password update, with an explanatory message. |
| FE-08 | Progress updates | Question Detail and Topic Detail optimistically change solved status but do not restore it when the request fails. Topic Detail has an explicit empty rollback branch, while Question Detail only logs to the console. The UI can claim progress that was never persisted. | [QuestionDetail.jsx](src/pages/QuestionDetail.jsx#L44-L52); [TopicDetail.jsx](src/pages/TopicDetail.jsx#L87-L92) | Retain the previous state, roll back on error, disable repeated clicks while pending, and show a toast. |

## Functional defects

| ID | Area | Issue and impact | Evidence | Recommended fix |
| --- | --- | --- | --- | --- |
| FE-09 | Command palette | The palette is rendered in `App`, but no component ever calls `setPaletteOpen(true)`: `App` passes `onOpenPalette` to `Navbar`, and `Navbar` accepts no props. Cmd/Ctrl+K opens the separate navbar search instead. The command palette is unreachable. | [App.jsx](src/App.jsx#L41-L87); [Navbar.jsx](src/components/layout/Navbar.jsx#L14-L15), [Navbar.jsx](src/components/layout/Navbar.jsx#L45-L63) | Accept and call `onOpenPalette` from Navbar, or remove the unused palette and use one search mechanism. |
| FE-10 | Footer tier links | The footer links use `?tier=1`, `?tier=2`, and `?tier=3`, but Companies only reads `q` and `type`. All three links display the unfiltered company list. | [Footer.jsx](src/components/layout/Footer.jsx#L156-L168); [Companies.jsx](src/pages/Companies.jsx#L45-L46) | Implement the `tier` URL filter or replace these links with filters the page actually supports. |
| FE-11 | Legal links | Login, Register, and AuthModal link to fragments `#terms` and `#privacy`, not application routes. Those fragments do not exist on the authentication pages, so users cannot reach the legal pages. | [Login.jsx](src/pages/Login.jsx#L230-L231); [Register.jsx](src/pages/Register.jsx#L250-L251); [AuthModal.jsx](src/components/ui/AuthModal.jsx#L324-L325) | Use React Router `<Link to="/terms">` and `<Link to="/privacy">`. |
| FE-12 | Search input | Clearing a `SearchInput` does not cancel its existing debounce timer. A user can type, immediately clear, and then have the stale query applied later, restoring the URL filter unexpectedly. There is also no timer cleanup on unmount. | [SearchInput.jsx](src/components/shared/SearchInput.jsx#L16-L29) | Clear the timer in `handleClear` and in a cleanup effect; use a debounced callback with cancellation. |
| FE-13 | Navbar quick search | Search calls are not cancelled or sequenced. A slower response for an earlier query can overwrite newer results; a pending timer also survives Navbar unmount. | [Navbar.jsx](src/components/layout/Navbar.jsx#L77-L100) | Use `AbortController` or a monotonically increasing request id, clear the timer in effect cleanup, and ignore stale responses. |
| FE-14 | Profile loading | If `GET /api/me` fails, Profile logs only to the console and renders an empty profile form with no error or retry option. | [Profile.jsx](src/pages/Profile.jsx#L27-L42) | Track and render an error state with retry; do not present mutation controls without a loaded profile. |
| FE-15 | Question navigation after error | A failed question request sets `error`, but a later successful request for another slug never clears it. Because the component instance is reused for parameter-only navigation, the error view can persist over valid data. | [QuestionDetail.jsx](src/pages/QuestionDetail.jsx#L27-L42) | Call `setError(null)` before every request (and consider resetting stale question data). Apply the same pattern to Topic Detail. |
| FE-16 | Bookmarks | The “Total/Easy/Medium/Hard” counters and “Showing … of … bookmarks” calculations use only the current 30-item page, not the server’s total collection. Removing the final item on a page can also leave an empty page rather than returning to the previous page. | [Bookmarks.jsx](src/pages/Bookmarks.jsx#L46-L78), [Bookmarks.jsx](src/pages/Bookmarks.jsx#L116-L127), [Bookmarks.jsx](src/pages/Bookmarks.jsx#L197-L272) | Label counts as page counts or request aggregate stats; after removal, refetch and move back one page when the page becomes empty. |
| FE-17 | Error recovery | The route error boundary has no reset key tied to location. After one route throws, normal navigation cannot render a different page because the boundary remains in `hasError` state; the user must reload or manually click “Try Again.” | [App.jsx](src/App.jsx#L52-L84); [ErrorBoundary.jsx](src/components/shared/ErrorBoundary.jsx#L13-L72) | Key the boundary by pathname or reset it in `componentDidUpdate` when location changes. |
| FE-18 | Status control | `StatusBadge` visually supports `attempted`, and the API supports it, but its only click transition is `not-started ↔ solved`. Users cannot set `attempted` anywhere in the current frontend. | [StatusBadge.jsx](src/components/ui/StatusBadge.jsx#L3-L20) | Provide a status menu/cycle that includes `attempted`, or remove unsupported status presentation. |
| FE-19 | Configuration | `src/lib/config.js` says `VITE_API_URL` is required, but it is never imported. The actual client silently falls back to `http://localhost:5000`, so a production build without the variable will call the visitor’s localhost rather than fail safely. | [config.js](src/lib/config.js#L9-L27); [client.js](src/api/client.js#L6-L11) | Use the validated config in the API client and require a deployment-time URL; do not silently use localhost in production. |

## Accessibility, security, and reliability concerns

| ID | Area | Issue and impact | Evidence | Recommended fix |
| --- | --- | --- | --- | --- |
| FE-20 | Auth storage | Access and refresh tokens are stored in `localStorage`, making them readable by any successful XSS payload. | [AuthContext.jsx](src/context/AuthContext.jsx#L7-L35); [client.js](src/api/client.js#L15-L18) | Prefer secure, `HttpOnly`, `SameSite` cookies and add appropriate CSRF protection; reduce XSS exposure regardless. |
| FE-21 | Modal keyboard access | CommandPalette declares a modal dialog but has no focus trap or focus restoration. Keyboard users can tab into the page behind the overlay. The mobile drawer has the same issue and is not exposed as a dialog. | [CommandPalette.jsx](src/components/ui/CommandPalette.jsx#L75-L122); [Navbar.jsx](src/components/layout/Navbar.jsx#L345-L405) | Reuse the shared modal focus-trap behavior, restore focus on close, and give the drawer modal semantics. |
| FE-22 | Inert auth-only actions | Bookmark buttons remain enabled when a user is signed out. They do nothing because no handler is supplied, but still look and announce as actionable controls. | [CompanyDetail.jsx](src/pages/CompanyDetail.jsx#L164-L169); [TopicDetail.jsx](src/pages/TopicDetail.jsx#L268-L273); [BookmarkBtn.jsx](src/components/ui/BookmarkBtn.jsx#L4-L17) | Disable the control with a clear sign-in affordance, or open Login when clicked. |
| FE-23 | Placeholder external links | Contact and footer social links point to generic service homepages (for example, `github.com` and `discord.com`) rather than the project’s repository/community. The UI claims they are project channels. | [Contact.jsx](src/pages/Contact.jsx#L246-L275); [Footer.jsx](src/components/layout/Footer.jsx#L65-L104) | Configure verified project URLs or remove the links until they exist. |
| FE-24 | Unused utility defects | `useLocalStorage` uses its captured `storedValue` when applying functional updates, so two rapid functional updates can lose one update. `useIntersection` ignores changes to its `options` argument after mount. | [useLocalStorage.js](src/hooks/useLocalStorage.js#L12-L37); [useIntersection.js](src/hooks/useIntersection.js#L15-L32) | Implement storage updates via the React state updater and include stable options in the observer dependencies (or clearly document static-only options). |

## Build-quality failures

`npm run lint` currently exits with code 1. These imports/values stop CI setups that enforce linting:

| File | Errors |
| --- | --- |
| `src/pages/About.jsx` | Unused imports: `Target`, `Users`, `ShieldCheck`, `Zap`, `Flame` |
| `src/pages/Dashboard.jsx` | Unused imports: `Trophy`, `Zap`; unused `totalOffset` |
| `src/pages/Privacy.jsx` | Unused imports: `Lock`, `Cookie` |
| `src/pages/Terms.jsx` | Unused imports: `BookOpen`, `AlertTriangle`, `ShieldCheck` |

There is also one Fast Refresh warning: `AuthContext` and `AuthProvider` are exported together from [AuthContext.jsx](src/context/AuthContext.jsx#L1-L6). Move the context object into its own module.

## Suggested repair order

1. Fix FE-01 through FE-08: they block accurate data, contact submission, notes, and session correctness.
2. Repair FE-09 through FE-19, then add route/API integration tests for the affected flows.
3. Remove the lint failures and Fast Refresh warning; require `npm run lint` and `npm run build` in CI.
4. Address FE-20 through FE-24 before production release, prioritizing token storage and modal accessibility.

