const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// I see my `inlineImageDraw` replacement from earlier (`fix_strike.cjs`) wasn't actually applied properly or was lost, because `if (seg.type === 'image' && seg.src)` just has the original logic `const img = new Image(); ... img.onload = ...`.
// Ah! I rolled back everything to origin/main! My `fix_strike.cjs` changes are gone! I only reapplied `fix_math.cjs` and `fix_deps.cjs`!
// Yes, the image drawing logic is still using the generic block-level drawing logic, AND it captures `cursorX` and `cursorY` dynamically because `cursorY` is captured by closure, but `cursorX` and `cursorY` are variables defined outside the loop using `let cursorX = currentMarginLeft; let cursorY = currentMarginTop;`.
// Wait, `cursorX` and `cursorY` are defined OUTSIDE the loop that iterates over pages/lines!
// Wait, `let cursorY = currentMarginTop;` is updated synchronously for all lines. When `img.onload` fires asynchronously, `cursorY` has already advanced to the END OF THE PAGE!
// EXACTLY! This is why all images show up at the bottom/end of the page!
// The closure captures the reference to the `cursorY` VARIABLE, not its value at that moment.

// We need to capture the VALUE by copying it:
// `const drawX = cursorX; const drawY = cursorY;`
// And `img.onload = () => { ctx.drawImage(img, drawX, drawY, ...) }`.

// Since I have to implement both inline-image logic AND fix this closure scope bug:

const imageDrawLogic = `
           if (seg.type === 'image' && seg.src) {
               const drawW = seg.width || (150 * SCALE);
               const drawH = seg.height || (100 * SCALE);

               let drawX = cursorX;
               let drawY = cursorY;

               if (seg.isInline) {
                   drawY = cursorY - drawH / 2; // roughly center it
                   cursorX += drawW + (spacingFactor * SCALE);
               } else {
                   maxLineHeight = drawH + 20;
               }

               const img = new Image();
               img.crossOrigin = 'anonymous';
               img.onload = () => {
                 ctx.drawImage(img, drawX, drawY, drawW, drawH);
                 // Selection handles (optional)
                 // ctx.fillStyle = "rgba(59, 130, 246, 0.5)";
                 // ctx.fillRect(drawX - 5, drawY - 5, 10, 10);
                 // ctx.fillRect(drawX + drawW - 5, drawY + drawH - 5, 10, 10);
               };
               img.src = seg.src;
               return;
           }
`;

content = content.replace(/if \(seg\.type === 'image' && seg\.src\) \{[\s\S]*?maxLineHeight = drawH \+ 20;\n           \}/, imageDrawLogic);

// Also in the text block:
// When inline image is encountered, we did push to `currentLine`.
// We have `if (seg.type === 'text' || (seg.type === 'image' && seg.isInline))`
// Wait, in my `fix_math.cjs` rewrite earlier, did I re-apply the text split `if (seg.type === 'text' || ...)`?
// Let's check!
fs.writeFileSync('src/App.tsx', content);
