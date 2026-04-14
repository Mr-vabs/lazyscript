const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Currently, font size and messiness are strictly global.
// "if I select the text and try to change the messiness and font size for selected text only then its applying to whole text not just the selected text"
// The sliders are `<input type="range" ... onChange={(e) => setUiFontSize(parseInt(e.target.value))}>`
// We can modify the change handler:
// 1. Check if there's a selection inside `editorRef.current`.
// 2. If there is a selection (and it's not collapsed), apply a span wrapper to the selected text: `<span style="font-size: ${size}px" data-skew="${skew}">...</span>`.
// 3. Otherwise, set the global variable.

const applyCustomStyle = `
  const applySelectionStyle = (styleName: string, value: string, globalSetter: Function) => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed && editorRef.current?.contains(sel.anchorNode)) {
          // If we have a selection, wrap it in a span
          document.execCommand('styleWithCSS', false, 'true');

          if (styleName === 'fontSize') {
              // Instead of execCommand fontSize which uses 1-7, we must wrap it manually or use a trick
              const span = document.createElement('span');
              span.style.fontSize = value + 'px';
              const range = sel.getRangeAt(0);
              span.appendChild(range.extractContents());
              range.insertNode(span);
          } else if (styleName === 'skew') {
              const span = document.createElement('span');
              span.dataset.skew = value;
              const range = sel.getRangeAt(0);
              span.appendChild(range.extractContents());
              range.insertNode(span);
          }
          triggerParse();
      } else {
          // No selection, apply globally
          globalSetter();
      }
  };
`;

content = content.replace("// --- DRAWING LOGIC ---", applyCustomStyle + "\n  // --- DRAWING LOGIC ---");

const fontSizeSlider = `<input type="range" min="14" max="32" step="1" value={uiFontSize} onChange={(e) => { const v = parseInt(e.target.value); setUiFontSize(v); applySelectionStyle('fontSize', v.toString(), () => setUiFontSize(v)); }} />`;
content = content.replace(/<input type="range" min="14" max="32" step="1" value=\{uiFontSize\} onChange=\{\(e\) => setUiFontSize\(parseInt\(e\.target\.value\)\)\} \/>/, fontSizeSlider);

const skewSlider = `<input type="range" min="0" max="3" step="0.5" value={uiSkewFactor} onChange={(e) => { const v = parseFloat(e.target.value); setUiSkewFactor(v); applySelectionStyle('skew', v.toString(), () => setUiSkewFactor(v)); }} />`;
content = content.replace(/<input type="range" min="0" max="3" step="0\.5" value=\{uiSkewFactor\} onChange=\{\(e\) => setUiSkewFactor\(parseFloat\(e\.target\.value\)\)\} \/>/, skewSlider);

// And we must read these values in `traverse`.
// In `traverse`:
// `const el = node as HTMLElement;`
// We need to parse custom font size and skew.
content = content.replace(/type TextSegment = \{/, "type TextSegment = { fontSize?: number; skew?: number; ");

// In `traverse` recursive function definition:
// `const traverse = (node: Node, style: { color: string, isBold: boolean, isUnderline: boolean }, listContext: { type: string, index: number } | null) => {`
// Add `fontSize` and `skew` to `style`.
content = content.replace(/const traverse = \(node: Node, style: \{ color: string, isBold: boolean, isUnderline: boolean \}, listContext: \{ type: string, index: number \} \| null\) => \{/g, "const traverse = (node: Node, style: { color: string, isBold: boolean, isUnderline: boolean, fontSize?: number, skew?: number }, listContext: { type: string, index: number } | null) => {");

// In `traverse` logic:
const readCustomStyles = `
        const rawAlign = (el.style.textAlign || el.getAttribute('align') || '').toLowerCase();
        let align = 'left' as AlignType;
        if (rawAlign === 'center') align = 'center';
        if (rawAlign === 'right') align = 'right';

        let newFontSize = style.fontSize;
        if (el.style.fontSize) {
            const parsed = parseInt(el.style.fontSize);
            if (!isNaN(parsed)) newFontSize = parsed;
        }
        let newSkew = style.skew;
        if (el.dataset.skew) {
            newSkew = parseFloat(el.dataset.skew);
        }
`;
content = content.replace(/const rawAlign = \(el\.style\.textAlign \|\| el\.getAttribute\('align'\) \|\| ''\)\.toLowerCase\(\);[\s\S]*?if \(rawAlign === 'right'\) align = 'right';/, readCustomStyles);

// When pushing `TextSegment`, include them:
content = content.replace(/segments\.push\(\{ type: 'text', text: bullet, color: newColor, isBold: true \}\);/g, "segments.push({ type: 'text', text: bullet, color: newColor, isBold: true, fontSize: newFontSize, skew: newSkew });");
content = content.replace(/segments\.push\(\{ type: 'text', text, color: newColor, isBold: newBold, isUnderline: newUnderline, align: align \}\);/g, "segments.push({ type: 'text', text, color: newColor, isBold: newBold, isUnderline: newUnderline, align: align, fontSize: newFontSize, skew: newSkew });");
content = content.replace(/traverse\(child, \{ color: newColor, isBold: newBold, isUnderline: newUnderline \}, newListContext\);/g, "traverse(child, { color: newColor, isBold: newBold, isUnderline: newUnderline, fontSize: newFontSize, skew: newSkew }, newListContext);");
content = content.replace(/segments\.push\(\{ type: 'text', text, color: style\.color, isBold: style\.isBold, isUnderline: style\.isUnderline \}\);/g, "segments.push({ type: 'text', text, color: style.color, isBold: style.isBold, isUnderline: style.isUnderline, fontSize: style.fontSize, skew: style.skew });");

// The initial call to traverse:
content = content.replace(/traverse\(root, \{ color: '#000000', isBold: false, isUnderline: false \}, null\);/, "traverse(root, { color: '#000000', isBold: false, isUnderline: false, fontSize: undefined, skew: undefined }, null);");

// And finally, in the rendering logic:
// `const effectiveFont = seg.isCodeLine ? ... : ... `
// We must override `CURRENT_FONT_SIZE` with `seg.fontSize` and `skewFactor` with `seg.skew`.
const renderModifications = `
            const segmentFontSize = (seg.fontSize || baseFontSize) * SCALE;
            const segmentSkew = seg.skew !== undefined ? seg.skew : skewFactor;

            const effectiveFont = seg.isCodeLine
                ? \`normal \${segmentFontSize}px monospace\`
                : \`\${seg.isBold ? 'bold' : 'normal'} \${segmentFontSize}px \${CURRENT_FONT.family}\`;

            ctx.font = effectiveFont;
`;

// Oh wait, text width calculation inside text chunks loop:
const measureTextCall = `
            const wordWidth = measureTextWithSpacing(word, ctx.font, spacingFactor);
`;

content = content.replace(/const effectiveFont = seg\.isCodeLine[\s\S]*?ctx\.font = effectiveFont;\n            const wordWidth = measureTextWithSpacing\(word, ctx\.font, spacingFactor\);/, renderModifications + "            const wordWidth = measureTextWithSpacing(word, ctx.font, spacingFactor);");

// Also substitute skewFactor when rendering text chunks
content = content.replace(/const rng = mulberry32\(index \+ baseFontSize \+ Math\.floor\(skewFactor \* 100\)\);/g, `const getRng = (skewParam: number) => mulberry32(index + baseFontSize + Math.floor(skewParam * 100));\n      let rng = getRng(skewFactor);`);

content = content.replace(/const rX = \(rng\(\) - 0\.5\) \* skewFactor \* 1\.5;\n              const rY = \(rng\(\) - 0\.5\) \* skewFactor \* 1\.5;\n              const rRot = \(rng\(\) - 0\.5\) \* 0\.03 \* skewFactor;\n              const rScaleX = 1 \+ \(rng\(\) - 0\.5\) \* skewFactor \* 0\.05;\n              const rScaleY = 1 \+ \(rng\(\) - 0\.5\) \* skewFactor \* 0\.1;/g, `
              const currentSkew = seg.skew !== undefined ? seg.skew : skewFactor;
              rng = getRng(currentSkew);
              const rX = (rng() - 0.5) * currentSkew * 1.5;
              const rY = (rng() - 0.5) * currentSkew * 1.5;
              const rRot = (rng() - 0.5) * 0.03 * currentSkew;
              const rScaleX = 1 + (rng() - 0.5) * currentSkew * 0.05;
              const rScaleY = 1 + (rng() - 0.5) * currentSkew * 0.1;
`);

content = content.replace(/ctx\.globalAlpha = Math\.max\(0\.4, 1 - \(rng\(\) \* skewFactor \* 0\.2\)\);/g, `ctx.globalAlpha = Math.max(0.4, 1 - (rng() * (seg.skew !== undefined ? seg.skew : skewFactor) * 0.2));`);
content = content.replace(/if \(skewFactor > 1 && rng\(\) > 0\.5\) \{/g, `if ((seg.skew !== undefined ? seg.skew : skewFactor) > 1 && rng() > 0.5) {`);


fs.writeFileSync('src/App.tsx', content);
