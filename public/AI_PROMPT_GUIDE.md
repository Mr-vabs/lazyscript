# LazyScript AI Prompt Guide

Use the **Copy AI prompt** button in the editor. The prompt now explicitly instructs an AI to return raw HTML and to preserve mathematical notation as LaTeX delimiters rather than rendering formulas as images.

## Formula conventions

- Inline: `$x^2 + y^2 = z^2$`
- Display: `$$\\frac{a+b}{c}=d$$` in its own paragraph
- Use braces for multi-character superscripts/subscripts.
- Keep LaTeX out of `<pre>`, `<code>`, HTML attributes, and image elements.
- Do not use unsupported matrix/array/aligned/cases environments; use an HTML table for tabular data.

The renderer supports a practical LaTeX subset, not all of LaTeX. See `src/engine/math.ts` for the current implementation.
