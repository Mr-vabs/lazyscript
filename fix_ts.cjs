const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// move variable declarations up before line 794
const variables = `
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

content = content.replace(/let newFontSize = style\.fontSize;\n        if \(el\.style\.fontSize\) \{\n            const parsed = parseInt\(el\.style\.fontSize\);\n            if \(!isNaN\(parsed\)\) newFontSize = parsed;\n        \}\n        let newSkew = style\.skew;\n        if \(el\.dataset\.skew\) \{\n            newSkew = parseFloat\(el\.dataset\.skew\);\n        \}/, "");

content = content.replace(/const newUnderline = \(tagName === 'U' \|\| el\.style\.textDecoration === 'underline'\) \|\| style\.isUnderline;/g, `const newUnderline = (tagName === 'U' || el.style.textDecoration === 'underline') || style.isUnderline;\n` + variables);

fs.writeFileSync('src/App.tsx', content);
