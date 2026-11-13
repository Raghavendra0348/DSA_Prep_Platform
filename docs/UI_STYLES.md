# Interface styles

The site uses the charcoal and muted green palette defined in `frontend/src/index.css`, with supporting spacing, typography, and surface tokens in `frontend/src/styles/tokens.css`.

Use `--bg-primary` for the page, `--bg-secondary` for cards and controls, `--bg-hover` for interaction feedback, and `--border` for separators. Use `--accent` with `--on-accent` for primary actions, and `--accent-dim` for selected tabs. Retain difficulty/status colors for those meanings.

Shared corner sizes are 6px for controls, 8–10px for cards, and 12px for dialogs. Page titles use 28–34px, a 600 weight, and tight spacing. Larger landing typography is intentional. Avatars and progress rings retain circular shapes. Cards use borders rather than glow or floating hover effects. Dropdowns and dialogs retain a subtle shadow for separation.

Shared UI lives in `frontend/src/components/ui`, shared navigation in `frontend/src/components/layout`, and page-specific layouts beside the pages. The mobile navigation uses the global palette and does not redefine it.

## Optional Google authentication

Set `VITE_GOOGLE_CLIENT_ID` in `frontend/.env.local` to your actual Google OAuth client ID, and restart Vite. Configure the matching `GOOGLE_CLIENT_ID` on the backend. Without the frontend client ID, the app shows an unavailable Google button and keeps email authentication usable.

Run `npm run check:google-config` from `frontend` to check missing and configured client IDs. No real Google login occurs during this check.
