# Liquid metal hero integration

The frontend supports mixed JSX and TSX. Existing pages remain JavaScript.

- Reusable UI: `src/components/ui/` (already present, exposed as `@/components/ui`).
- Hero: `src/components/ui/liquid-metal-hero.tsx`.
- Supplied demo: `src/components/ui/liquid-metal-hero-demo.tsx`.
- shadcn primitives: `button.tsx`, `badge.tsx`, and `card.tsx` in the UI folder.
- Class helper: `src/lib/utils.ts`.
- Existing global styles: `src/index.css`; page styles remain beside pages.
- Tailwind entry: `src/styles/tailwind.css`, imported by `src/main.jsx`.
- TypeScript paths: `tsconfig.json`; runtime alias remains in `vite.config.js`.

TypeScript, Tailwind 3, PostCSS, and the requested component dependencies are installed. No separate project initialization is required. `components.json` provides shadcn's aliases and style configuration. Keeping UI primitives in this folder makes the supplied `@/components/ui/...` imports resolve consistently.

Tailwind preflight is disabled and utilities are scoped under `.liquid-metal-hero` so they do not restyle the existing application. Future Tailwind components need the same scope or an intentionally expanded configuration. The shader's background is confined to the hero, has a dark backing layer, and stops when reduced motion is requested. The shader uses its built-in backdrop shape; no stock photo or external image is needed.

The supplied component and demo are retained for reuse. The liquid-metal visual was removed from the homepage at the user's request. The homepage continues to use its original search and data hooks.

Run from `frontend`:

```sh
npm install
npm run typecheck
npm run build
npm run dev
```

For additional shadcn primitives, use `npx shadcn@latest add <component>` from `frontend`, then review the generated styles against the scoped Tailwind configuration.
