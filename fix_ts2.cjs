const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/for \(let i = 0; i < text\.length; i\+\+\) width \+= ctx\.measureText\(text\[i\]\)\.width \+ \(spacing \* SCALE\);/g, "for (let i = 0; i < text.length; i++) width += (ctx as CanvasRenderingContext2D).measureText(text[i]).width + (spacing * SCALE);");
content = content.replace(/for \(let i = 0; i < line\.length; i\+\+\) textWidth \+= ctx\.measureText\(line\[i\]\)\.width \+ \(spacingFactor \* SCALE\);/g, "for (let i = 0; i < line.length; i++) textWidth += (ctx as CanvasRenderingContext2D).measureText(line[i]).width + (spacingFactor * SCALE);");
content = content.replace(/textWidth \+= ctx\.measureText\(seg\.text\[i\]\)\.width \+ \(spacingFactor \* SCALE\);/g, "textWidth += (ctx as CanvasRenderingContext2D).measureText(seg.text[i]).width + (spacingFactor * SCALE);");

fs.writeFileSync('src/App.tsx', content);
