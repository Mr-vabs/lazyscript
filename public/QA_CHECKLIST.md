# LazyScript v21 — Release QA checklist

## Core editing
- [ ] Type, paste, select, bold, underline, recolor, align, and change case.
- [ ] Verify editor changes update the preview without duplicate content.
- [ ] Verify large paste remains usable.

## Formula engine
- [ ] Insert inline `x^2 + y^2 = z^2` between words and verify baseline/alignment.
- [ ] Insert display `\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}` and verify centred placement.
- [ ] Test fractions, roots, superscripts, subscripts, Greek symbols, summations and matrices.
- [ ] Click an existing formula, edit its LaTeX, and verify the original is replaced rather than duplicated.
- [ ] Save/import a `.lazy` project containing formulas; verify formulas remain visible and editable.
- [ ] Export a PDF containing inline and display formulas; inspect sharpness, spacing and page breaks.
- [ ] Test first-use CDN failure/offline mode and confirm a readable error toast appears.

## Image layout
- [ ] Insert images using 1:1, 4:3, 3:4, 16:9 and 9:16 frames.
- [ ] Verify `Contain` shows the complete source without distortion.
- [ ] Verify `Cover` fills the frame with a centred crop.
- [ ] Save/import image-containing projects and confirm dimensions/fit are retained.
- [ ] Export images to PDF and inspect frame size, clipping and page breaks.

## Pagination and rendering
- [ ] Short document remains one page.
- [ ] Long paragraphs flow to subsequent pages without clipping.
- [ ] Font-size changes near page boundaries do not create overlaps.
- [ ] Code blocks split cleanly across pages.
- [ ] Tables with rowSpan/colSpan render correctly across page boundaries.
- [ ] Images and formulas do not overlap adjacent text or escape the page margins.

## Drawing / save-load / PDF
- [ ] Draw, stop, undo, and save strokes; confirm strokes remain on the correct page after reflow.
- [ ] Save and reload a current project; load a v19/v20 project and verify compatibility.
- [ ] Reject invalid JSON without changing the current document; reject files over 12 MB.
- [ ] Export one-page and multi-page PDFs with Scanner OFF and ON.
- [ ] Confirm progress clears on success/failure, output is A4, and page count matches preview.

## Responsive smoke test
- [ ] Desktop viewport (1366×768).
- [ ] Tablet viewport (768×1024).
- [ ] Mobile viewport (390×844); confirm formula and image dialogs fit the screen.

## Required commands before deployment
```bash
npm ci
npm run build
npm run lint
```


## Handwritten mathematics (V21.1)
- [ ] Insert `x^2 + y^2 = z^2`; confirm glyphs look handwritten, not textbook typeset.
- [ ] Insert `\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}`; confirm fraction bar and radical are aligned.
- [ ] Insert inline and display formulas; confirm inline baseline and centred display placement.
- [ ] Reopen a formula and confirm the original LaTeX is editable.
- [ ] Save/import a `.lazy` project containing formulas; confirm source and rendering persist.
- [ ] Export PDF and inspect formula sharpness, clipping, baseline and page breaks.
- [ ] Test on mobile and with network disabled after the Caveat font has loaded once; confirm fallback remains readable.
