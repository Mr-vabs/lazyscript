const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// For inline images, `seg.text` is undefined, but the `words` logic accesses `seg.text!.split(...)`. This will crash for inline images.
// Let's rewrite `if (seg.type === 'text' || (seg.type === 'image' && seg.isInline))`
const textHandling = `
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
        // For text wrapping:
        const words = seg.text!.split(/(\\s+)/);
`;
content = content.replace(/if \(seg\.type === 'text' \|\| \(seg\.type === 'image' && seg\.isInline\)\) \{\n\n        \/\/ If it's a code line[\s\S]*?const words = seg\.text!\.split\(\/\(\\s\+\)\/\);/, textHandling);


// And in the drawing part, we need to correctly process `seg.type === 'image'`.
const inlineImageDraw = `
        line.forEach(seg => {
           if (seg.type === 'image' && seg.src) {
               if (!seg.isInline) {
                   const img = new Image();
                   img.crossOrigin = 'anonymous';
                   const drawW = seg.width || (150 * SCALE);
                   const drawH = seg.height || (100 * SCALE);
                   img.onload = () => {
                     ctx.drawImage(img, cursorX, cursorY, drawW, drawH);
                     // Selection handles
                     ctx.fillStyle = "rgba(59, 130, 246, 0.5)";
                     ctx.fillRect(cursorX - 5, cursorY - 5, 10, 10);
                     ctx.fillRect(cursorX + drawW - 5, cursorY + drawH - 5, 10, 10);
                   };
                   cursorY += drawH + 20;
               } else {
                   const img = new Image();
                   img.crossOrigin = 'anonymous';
                   const drawW = seg.width || (150 * SCALE);
                   const drawH = seg.height || (100 * SCALE);
                   const inlineX = cursorX;
                   // Adjust Y slightly to align with text baseline
                   const inlineY = cursorY + (CURRENT_LINE_HEIGHT - drawH) / 2;
                   img.onload = () => {
                       ctx.drawImage(img, inlineX, inlineY, drawW, drawH);
                   };
                   cursorX += drawW + (spacingFactor * SCALE);
               }
               return;
           }
`;

content = content.replace(/line\.forEach\(seg => \{\n           if \(seg\.type === 'image' && seg\.src\) \{[\s\S]*?cursorY \+= drawH \+ 20;\n               return;\n           \}/, inlineImageDraw);


fs.writeFileSync('src/App.tsx', content);
