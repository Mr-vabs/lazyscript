# LazyScript v21.0.0 — Formula & Image Layout Release

## What changed

### Mathematical formula authoring
- Added a dedicated formula insertion control in the editor toolbar.
- Uses MathJax TeX-to-SVG rendering, loaded on demand from jsDelivr when the first formula is inserted.
- Supports inline formulas and centred display formulas.
- Preserves the original LaTeX in the `.lazy` document as `data-ls-latex`, so the formula can be reopened and edited by clicking it in the editor.
- Formula SVGs are measured and treated as layout segments by the A4 renderer, rather than being treated as ordinary text or arbitrary raster pictures. This improves sizing, line placement and PDF sharpness.
- Formula rendering requires an internet connection the first time the engine is loaded. Once loaded, MathJax is cached by the browser for the session/cache lifetime.

### Fixed image layout
- Images now use explicit dimensions derived from the selected aspect ratio.
- Added `Contain` (preserve the complete image without cropping) and `Cover` (crop to fill the selected frame) modes.
- The canvas renderer applies the same fit mode and fixed frame dimensions, reducing layout shifts and image stretching.
- Existing saved images without the new fit attribute default to `Contain`.

### Retained from V20
- Project import validation and legacy defaults.
- Bounded project file size and drawing payload validation.
- Project save URL cleanup.
- PDF export progress, error handling and deterministic scanner effect.
- Existing editor, handwriting renderer, tables, drawings and `.lazy` project compatibility.

## Known limitations / verification status
- Formula rendering is vector-based SVG output internally; the A4 canvas preview and PDF pipeline rasterize page canvases at the existing high-resolution scale. It is not a native editable text glyph inside the final PDF.
- The formula engine is fetched from a CDN on first use. A future offline bundle can vendor MathJax locally if desired.
- The current `contentEditable` editor and canvas pagination architecture are retained to preserve compatibility; this release does not claim a full editor-engine rewrite.
- The TypeScript/production build could not be completed in this environment because dependencies could not be installed (network/package fetch timed out). TSX transpilation syntax check passed, but this is not a substitute for `npm run build` or browser QA.
