# LazyScript 2

Turn typed text, LaTeX maths, tables and photos into handwritten A4 pages. Everything runs in the browser; nothing is uploaded.

## Run
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # outputs dist/ (Netlify: see netlify.toml)
npm run typecheck
```

## Maths (native, not images)
Write LaTeX between dollar signs: `$x^2$` inline, `$$\frac{a}{b}$$` on its own centred line. Also `\( \)` and `\[ \]`.
Use the **Formula** button for a live preview. The **Copy AI prompt** button explicitly instructs ChatGPT/other assistants to return LaTeX between `$...$` or `$$...$$` delimiters, never formula images, and to stay within the renderer-supported LaTeX subset. See `AI_PROMPT_GUIDE.md`. Pasting copied KaTeX/MathML formulas (ChatGPT, Gemini, Claude, Wikipedia) converts them back to LaTeX automatically.

Supported: `\frac \sqrt[n]{} ^ _ \sum \prod \int \oint \lim` (limits stacked in display mode), Greek letters, `\bar \hat \vec \tilde \dot`,
`\left( \right)` stretchy brackets, `\text{}`, `\sin \cos \log ...`, common operators and arrows.
Not yet: matrices/`aligned`, `\binom`, `\overbrace`.

Why it aligns: each formula is laid out as a box with ascent and descent, drawn in the handwriting font on the same baseline as the text.
A line holding a tall formula grows by whole ruled lines and the baseline stays on a rule, so text after it never drifts off the paper lines.

## Images
Images go into a fixed frame: pick a shape (1:1, 4:3, 3:4, 16:9, 3:2), a width (small, medium, full) and a fit (fill/crop or show whole).
The frame height is rounded up to whole ruled lines, so the layout is identical every time.
Images are downscaled on import and only `data:` images are allowed (remote images would break PDF export).

## Layout
```
src/engine/  config  tokens (DOM -> tokens)  math (LaTeX -> boxes)  layout (pagination)  render (canvas)  pdf  fonts  images
src/lib/     sanitize (DOMPurify + KaTeX normaliser)  storage (autosave, .lazy files)
src/App.tsx  UI
```
Fonts are self-hosted via @fontsource (no Google Fonts request, same output on every device). Kalam covers Devanagari.
Math symbols the handwriting font lacks (Greek, ∑, ∫) fall back to a system maths font.

## Not included (yet)
Drawing/pen mode, table merge/row/column tools, unit tests.
