# Handwritten Math Engine — V21.1.0

- Replaces MathJax SVG image output with a local LaTeX-subset parser and handwritten SVG renderer.
- Formula source remains stored in `data-ls-latex`; clicking a formula opens the original source for editing.
- Output is SVG-based and therefore remains crisp when rasterized into the existing A4 canvas/PDF pipeline.
- The glyphs use the app's Caveat handwriting face and hand-drawn fraction/radical strokes.
- Supported: ordinary symbols and digits, common Greek commands, fractions (`\\frac`), roots (`\\sqrt`), superscripts/subscripts, common operators, sum/integral symbols, and basic grouping.
- This is intentionally a practical assignment-math subset, not a complete TeX implementation. Complex aligned environments, advanced chemistry notation, and arbitrary LaTeX packages are not supported yet.
- The Google Fonts stylesheet is already used by the app; if Caveat cannot load, the SVG falls back to the browser cursive font.

## Manual acceptance expressions

1. `x^2 + y^2 = z^2`
2. `\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}`
3. `\\sqrt{x_1 + x_2}`
4. `\\alpha + \\beta \\leq \\theta`
5. `\\int_0^1 x^2 \\, dx`
6. `\\sum_{i=1}^n i = \\frac{n(n+1)}{2}`
