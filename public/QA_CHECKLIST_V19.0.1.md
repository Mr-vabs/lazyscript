# LazyScript v19.0.1 QA checklist

## Editor and export
- [ ] Type, paste, format, and change case.
- [ ] Verify question text black/bold and answer text blue/normal from copied AI prompt output.
- [ ] Verify PDF export page breaks and fonts.
- [ ] Save and reload a `.lazy` project; confirm settings and drawings persist.
- [ ] Verify drawing mode and undo.

## Handwriting
- [ ] Test all 12 fonts and ensure each is loaded before preview/PDF export.
- [ ] Test Latin text and Greek symbols α β γ Γ θ λ μ π Δ Ω at multiple humanization values.
- [ ] Verify ink colour, messiness, letter spacing, font size, and paper modes.

## Images and tables
- [ ] Insert all image aspect ratios; test block, float-left and float-right wrapping.
- [ ] Verify image wrap ends after image height and no text overlaps the figure.
- [ ] Test table auto-sizing with short and long cell content, multi-line cells, and narrow columns.
- [ ] Test selected-table Float L, Float R and Inline actions.
- [ ] Test add/delete row/column, merge right/down, and cell alignment.

## Responsive and deployment
- [ ] On mobile, Write and Preview switch on the first tap.
- [ ] Check tablet and desktop split layout.
- [ ] Run `npm ci && npm run build` with Node 22.
- [ ] Deploy the generated `dist/` directory on Netlify.
