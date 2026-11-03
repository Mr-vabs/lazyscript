# Tailwind CSS v3 deployment fix

- Pinned Tailwind CSS to `^3.4.17`.
- Restored the Tailwind v3 PostCSS plugin configuration (`tailwindcss` + `autoprefixer`).
- Kept the v3 `@tailwind` directives in `src/index.css`.
- Removed the stale v4 package lock so npm can resolve a consistent v3 dependency tree on Netlify and GitHub Actions.
- CI uses `npm install` (not `npm ci`) because this source package intentionally regenerates its lockfile during dependency resolution.

## Deploy

Commit the repository contents and push to the Netlify production branch. Netlify runs `npm run build`.

## Verification

This environment could not reach the npm registry, so a fresh dependency install and full Vite build could not be completed here. The change addresses the exact Tailwind v4 PostCSS incompatibility from the supplied Netlify log, but the first remote build must confirm dependency resolution.
