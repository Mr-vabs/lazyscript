const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/catch \(_err\)/g, "catch");
fs.writeFileSync('src/App.tsx', content);
