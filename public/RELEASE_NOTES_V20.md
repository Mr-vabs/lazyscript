# LazyScript v20.0.0 — Stability-first build

## Intent
V20 is a controlled hardening release based on the supplied v19 source snapshot. It does not attempt to replace the rendering engine or editor in one risky change.

## Implemented
- Central application version constant (`20.0.0`).
- Validated and normalized imported project payloads.
- Bounded project file size, content size, page index, stroke count, and stroke point count.
- Legacy defaults for optional/missing project settings.
- Sanitized imported HTML retained through DOMPurify.
- FileReader error handling and reset of the file input so the same file can be re-imported.
- Object URL cleanup after project save.
- PDF export guards, progress state, page count feedback, yielding between page batches, and error reporting.
- Stable deterministic scanner noise.

## Preserved
- Existing canvas layout and pagination logic.
- Existing table grid and merge logic.
- Existing image insertion workflow.
- Existing drawing tools.
- Existing HTML-to-page parser and handwriting profiles.
- Existing `.lazy` project shape (with versioned settings normalization).

## QA required before production deployment
1. `npm ci`
2. `npm run build`
3. `npm run lint`
4. Open the deployed staging build on desktop Chrome, Android Chrome, and Safari if available.
5. Test plain text, long text, headings, lists, code blocks, tables with merged cells, images, and drawings.
6. Export 1-page, 10-page, and 30-page PDFs with Scanner OFF and ON.
7. Save a project, refresh, import it, and compare settings/content/drawings.
8. Import an older `.lazy` project.
9. Try malformed JSON, a project with missing settings, and a file larger than 12 MB.
10. Confirm PDF output is not blank, clipped, or missing any page content.

## Deliberately deferred to later releases
- Web Worker PDF pipeline.
- New editor engine (TipTap/ProseMirror evaluation).
- Real handwriting profile extraction from user samples.
- Cover page / assignment mode.
- Equation and diagram authoring.
- Full undo/redo history across editor, drawing, and page operations.

These are not silently claimed as complete in this build.
