# Navbar Component Guide

`frontend/src/components/layout/Navbar.jsx` renders the site-wide navigation bar. It combines page navigation, quick search, authentication controls, a mobile drawer, and a safe logout confirmation flow.

## Dependencies

| Import | Purpose |
| --- | --- |
| `react-router-dom` | Provides links and programmatic navigation with `useNavigate`. |
| `useAuth` | Supplies the current `user` and the `logout` action. |
| `useSearch` | Fetches debounced, cached search results for questions, topics, and companies. |
| `lucide-react` | Renders interface icons. |
| `LeetCodeIcon` | Identifies question search results. |
| `Modal` | Displays the logout confirmation dialog. |

## Local state

| State | Meaning |
| --- | --- |
| `menuOpen` | Whether the mobile navigation drawer is visible. |
| `dropdownOpen` | Whether the signed-in user's profile menu is open. |
| `searchOpen` | Whether the quick-search result panel may be shown. |
| `logoutModalOpen` | Whether the logout confirmation modal is open. |

The component also keeps refs for the profile menu, search area, and search input. They support click-outside detection and the keyboard shortcut.

## Navigation and authentication

The desktop navigation always includes **Companies** and **Topics**. **Dashboard** is included only when a user is signed in.

- Guests see **Log In** and **Get Started** links.
- Signed-in users see an avatar, their name, and a profile dropdown with Dashboard, Bookmarks, Profile Settings, and Log Out.
- The avatar uses the first character of `user.name`.

`NavLink` is used for primary navigation so its active-route styling can be applied by CSS.

## Quick search

The search field reads and updates `searchQuery` from `useSearch('', 'all')`. When the user types, `handleSearchInput` updates the query and opens the search UI. The search hook performs its own 280 ms debounce and provides:

- `questions`
- `companies`
- `topics`
- `loading`

The results panel appears only when the query has at least two non-whitespace characters. It shows a loading state, an empty state, or grouped results. Result buttons navigate to the relevant question, company, or topic page. The panel also provides a link to the full `/search?q=...` results page.

Submitting the form follows the same full-search route when the query contains at least two characters. `clearSearch()` empties the query and closes the panel after navigation or when the clear button is pressed.

## Keyboard and outside-click behavior

- `Ctrl+K` or `Cmd+K` focuses the search field and opens search.
- `Escape` closes the profile menu, mobile drawer, and search panel; it also clears and blurs the search input.
- A document-level `mousedown` listener closes the profile dropdown or search panel when a click occurs outside its associated ref.

All event listeners are removed when the component unmounts.

## Mobile drawer

On smaller screens, the hamburger button toggles `menuOpen`. When it is open, the component renders a backdrop and the mobile navigation drawer. The drawer mirrors the main navigation and shows authentication or account actions appropriate to the current user.

While the drawer is open, the component sets `document.body.style.overflow` to `hidden` to prevent the page behind it from scrolling. Its effect cleanup restores the original scrolling behavior when the drawer closes or the component unmounts.

## Logout flow

Clicking **Log Out** does not immediately end the session. `handleLogout()` first closes any open menu or drawer and opens the modal. If the user confirms:

1. `confirmLogout()` closes the modal.
2. It awaits `logout()` from the authentication hook.
3. It navigates to the home route (`/`).

The modal also reassures the user that their progress is saved and displays their account identity when available.

## Props

| Prop | Description |
| --- | --- |
| `onOpenPalette` | Optional callback invoked from the search shortcut button when the search box is empty. This lets the parent open a command palette. |

## Related files

- `frontend/src/components/layout/Navbar.css` — visual styling and responsive behavior.
- `frontend/src/hooks/useAuth.js` — authentication state and logout logic.
- `frontend/src/hooks/useSearch.js` — search query, debouncing, and result data.
- `frontend/src/App.jsx` — route definitions used by Navbar links and navigation actions.
