const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/globalSetter: Function/g, "globalSetter: () => void");
content = content.replace(/const segmentSkew = seg.skew !== undefined \? seg.skew : skewFactor;/g, "");
content = content.replace(/let rng = getRng/g, "let rng = getRng");
fs.writeFileSync('src/App.tsx', content);
