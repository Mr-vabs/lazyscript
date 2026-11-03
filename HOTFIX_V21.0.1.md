# LazyScript V21.0.1 — CI lint hotfix

This patch addresses the five ESLint errors reported by the GitHub Actions `verify` job:

- Corrected the LaTeX quadratic-formula string escaping so `\pm` and `\sqrt` are represented as literal LaTeX commands in JavaScript strings.
- Changed the never-reassigned `newColor` binding from `let` to `const`.

The existing React Hooks exhaustive-deps findings are warnings, not errors, under the current ESLint configuration. They are intentionally not silenced or auto-fixed in this hotfix because changing callback dependencies without reviewing the callback relationships can alter editor behaviour.

## Validation status

The screenshot's five lint errors are addressed in source. A fresh dependency installation could not complete in the build environment, so a local ESLint run and production TypeScript/Vite build could not be completed here. GitHub Actions should be rerun after committing this patch. Do not treat the application as production-certified until the CI build and browser QA pass.
