# LazyScript v19.0.1 — Restoration & layout update

This release is based on the user-supplied original `lazyscript-main.zip` (the UI's original v19.0 baseline). It is an incremental restoration, not a replacement application.

## Preserved from the original baseline
- Original split editor / A4 preview UI and existing toolbar.
- Original paper modes, PDF export, project import/export, drawing, undo, table row/column and merge tools, alignment, case conversion, scanner effect, ink colour, zoom, and humanization controls.
- Original eight font choices and existing project data structure.
- Original Tailwind CSS v3 setup and lockfile (Tailwind 3.4.19 locked).

## Added / improved
- App version advanced from original v19.0 to v19.0.1; package and UI version are aligned.
- Font registry and AI prompt moved into `src/config/`; document model types moved into `src/types/`.
- Four additional handwriting fonts (Patrick Hand, Kalam, Architects Daughter, Caveat Brush), for 12 choices total.
- Greek glyphs (α, β, γ, Γ, θ, etc.) receive slightly stronger per-character handwriting variation using the existing humanization and messiness controls.
- Images can be inserted as block images or floated left/right with text wrapping around them.
- Existing tables continue to auto-size columns from cell content and wrap cell text; table toolbar now supports floating a selected table left/right or returning it inline so surrounding text can wrap.
- Mobile Write / Preview tabs switch immediately with a single tap.
- AI prompt explicitly enforces black bold questions and blue normal-weight answers, table/caption formatting, and math/figure guidance.
- Tailwind v3 PostCSS configuration is retained.

## Verification status
- TypeScript/TSX syntax transpilation: passed.
- Full `npm ci`, TypeScript typecheck, Vite production build, browser interaction and PDF visual QA: NOT verified in this environment because dependency installation did not complete (npm registry request timed out). Run `npm ci && npm run build` before deployment.
