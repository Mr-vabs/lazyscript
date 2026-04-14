const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// I need to ensure we don't have overlapping math
// The previous "huge gaps" might have been caused by standard `<img>` generation logic adding 20px bottom margins.
// In the current `isInline` logic, we do: `cursorY + (CURRENT_LINE_HEIGHT - drawH) / 2`.

// We also must ensure that `img.style.margin = '10px 0'` is gone. Wait, we changed it to:
// `img.style.display = 'inline-block';` or `display = 'block'; margin = '10px 0';`
// I can change `10px 0` to `0px 0`.

content = content.replace("img.style.margin = '10px 0';", "img.style.margin = '0px';");
content = content.replace("img.style.margin = '0px';", "img.style.margin = '0';");

fs.writeFileSync('src/App.tsx', content);
