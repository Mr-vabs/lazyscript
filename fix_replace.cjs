const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/displayMode: el\.tagName === 'PRE' \|\| el\.tagName === 'LATEKATEX' \|\| el\.tagName === 'LATEKATEX' \|\| el\.tagName === 'LATEKATEX'/g, "displayMode: el.tagName === 'PRE' || el.tagName === 'LATEKATEX'");

fs.writeFileSync('src/App.tsx', content);
