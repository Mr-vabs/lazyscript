# LazyScript V21.1.0

## Changes
- Replaced MathJax-rendered formula images with a handwritten-style SVG math renderer.
- Preserved editable LaTeX source for inserted formulas.
- Corrected SVG sizing so handwritten formula dimensions are retained by the document canvas pipeline.
- Kept the existing editor, handwriting, image, table, project and PDF workflows as the base.
- Bumped app version to 21.1.0.

## Known limitations
- The renderer supports a defined LaTeX subset, not full TeX/MathJax compatibility.
- Complex matrices/alignment environments and specialized notation need further work.
- Full production certification requires CI and browser/PDF acceptance tests to pass in the target GitHub/Netlify environment.
