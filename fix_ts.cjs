const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/let wordWidth = ctx.measureText\(word\)\.width;/g, "const wordWidth = (ctx as CanvasRenderingContext2D).measureText(word).width;");
content = content.replace(/const testWidth = measureTextWithSpacing\(testLine, \`normal \$\{CURRENT_FONT_SIZE\}px \$\{CURRENT_FONT\.family\}\`, spacingFactor\);/g, "const testWidth = measureTextWithSpacing(testLine, `normal ${CURRENT_FONT_SIZE}px ${CURRENT_FONT.family}`, spacingFactor);");
content = content.replace(/const w = measureTextWithSpacing\(text, \`normal \$\{CURRENT_FONT_SIZE\}px \$\{CURRENT_FONT\.family\}\`, spacingFactor\) \+ \(20 \* SCALE\);/g, "const w = measureTextWithSpacing(text, `normal ${CURRENT_FONT_SIZE}px ${CURRENT_FONT.family}`, spacingFactor) + (20 * SCALE);");

// Let's actually find where measureText is failing due to 'never' type.
fs.writeFileSync('src/App.tsx', content);
