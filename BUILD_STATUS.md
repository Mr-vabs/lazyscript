# LazyScript V21.0.0 — Build and release status

## Included deployment configuration

- Netlify build command: `npm run build`
- Netlify publish directory: `dist`
- Node.js version pinned to `22.16.0` through `netlify.toml` and `.nvmrc`
- SPA fallback configured in `public/_redirects`
- GitHub Actions CI workflow runs `npm ci`, `npm run lint`, and `npm run build` on pushes and pull requests to `main`/`master`

## Verification status

**Not yet certified as a production build.** The source package was prepared, but dependency installation could not complete in the build environment because npm installation timed out. Consequently, a successful TypeScript/Vite production build, ESLint run, and real-browser QA could not be recorded here. The earlier attempted build stopped before compilation because the required packages were not installed; this is an environment/dependency-install failure, not evidence of a successful build.

Do not treat the release as production-verified until the GitHub Actions workflow passes and the QA checklist has been completed against a Netlify deploy preview.

## Required release gate

1. Push the source to the GitHub branch connected to Netlify.
2. Confirm the GitHub Actions `LazyScript CI` workflow passes.
3. Confirm Netlify reports a successful deploy using `dist` as the publish directory.
4. Complete `QA_CHECKLIST.md`, especially formula editing/rendering, image sizing, PDF export, project save/import, and mobile layout.
5. Promote the deploy preview to production only after these checks pass.
