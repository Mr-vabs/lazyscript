const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The issue reported: "Formula being overlapping with other text. Not aligning correctly. Most of the formula being strike through".
// Also blank space.
// This is because we treat all images exactly the same: block level elements that trigger `flushLine()`.
// Let's modify the TextSegment and the parser to handle math inline.
// First: TextSegment needs `isInline` boolean.

content = content.replace(/type TextSegment = \{/, "type TextSegment = { isInline?: boolean; ");

// Then when replacing math with image:
// We should give it an attribute or dataset we can check. Wait, we parse HTML to segment.
// The image tags created from math have `className = 'math-rendered'`.
// In `traverse` for `IMG`:
const traverseImg = `
        if (tagName === 'IMG') {
            const imgEl = el as HTMLImageElement;
            const isMath = imgEl.classList.contains('math-rendered');
            segments.push({
               type: 'image',
               src: imgEl.src,
               width: imgEl.width * SCALE || 200 * SCALE,
               height: imgEl.height * SCALE || 150 * SCALE,
               isInline: isMath
            });
            return;
        }`;
content = content.replace(/if \(tagName === 'IMG'\) \{[\s\S]*?return;\n        \}/, traverseImg);

// Now in the flushLine and push logic:
// Where we handle seg.type === 'image':
const handleImage = `
      if (seg.type === 'table' || (seg.type === 'image' && !seg.isInline)) {
          if (currentLine.length > 0) flushLine();

          let height = 0;
          if (seg.type === 'table') height = (seg.tableData!.rows.length * (CURRENT_LINE_HEIGHT * 1.2)) + 20;
          else if (seg.type === 'image') height = seg.height! + 20;

          checkPageBreak(height);

          currentLines.push([seg]);
          currentY += height;
          return;
      }

      if (seg.type === 'text' || (seg.type === 'image' && seg.isInline)) {
`;
content = content.replace(/if \(seg\.type === 'table' \|\| seg\.type === 'image'\) \{[\s\S]*?if \(seg\.type === 'text'\) \{/, handleImage);

// In the text rendering branch, we need to handle inline image placement:
// But wait, the `text` branch loops over `seg.text.split(...)`. If it's an inline image, `seg.text` is undefined!
const handleTextOrInline = `
      if (seg.type === 'text' || (seg.type === 'image' && seg.isInline)) {
        if (seg.type === 'image' && seg.isInline) {
             const imgWidth = seg.width || 0;
             if (currentX + imgWidth > CANVAS_WIDTH - currentMarginRight) {
                 flushLine();
             }
             currentLine.push(seg);
             currentX += imgWidth + (spacingFactor * SCALE);
             return;
        }

        // If it's a code line, we might need to handle indentation visually in renderer
`;
content = content.replace(/if \(seg\.type === 'text' \|\| \(seg\.type === 'image' && seg\.isInline\)\) \{\n        \/\/ If it's a code line/, handleTextOrInline);

// The strike-through problem: this happens because inline images aren't drawn correctly in the rendering loop,
// and `if (seg.type === 'text')` in the renderer draws text. Wait, where is the canvas rendering loop?
fs.writeFileSync('src/App.tsx', content);
