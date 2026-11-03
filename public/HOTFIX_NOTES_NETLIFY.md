# Netlify TypeScript Hotfix

Base: current uploaded `main` branch ZIP (version 19.0.1).

## Changes
- Removed three unused type imports from `src/App.tsx` (`SegmentType`, `TableData`, `Point`).
- Moved the `setTableFloat` callback below the `triggerParse` declaration so its dependency reference is initialized before use. Runtime behavior is unchanged.
- Converted `Settings`, `Box`, and `Item` imports to type-only imports in the engine/storage modules to satisfy `verbatimModuleSyntax`.
- Replaced the TypeScript parameter property in `Parser` with an explicit readonly field and constructor assignment to satisfy `erasableSyntaxOnly`.

No UI, document layout, rendering, PDF, or feature behavior was intentionally changed. Package version remains 19.0.1.

## Verification status
The source changes address the TypeScript diagnostics supplied from Netlify. A local production build could not be completed in this environment: `npm ci` timed out while fetching dependencies, and the globally available TypeScript compiler could not resolve the project dependencies (`vite/client` and `node` types). Please run `npm ci && npm run build` in Netlify or a network-enabled local environment before promoting the hotfix.
