const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Also make sure the `<latekatex>` generated img isn't cropped!
const imgGen = `            const dataUrl = canvas.toDataURL('image/png');

            const img = document.createElement('img');
            img.src = dataUrl;
            img.className = 'math-rendered';
            img.width = canvas.width / 2;
            img.height = canvas.height / 2;
            img.style.width = (canvas.width / 2) + 'px';
            img.style.height = (canvas.height / 2) + 'px';
            img.style.border = 'none';
            img.style.outline = 'none';

            if (el.tagName === 'SPAN' || el.tagName === 'LATEKATEX') {
                img.style.display = 'inline-block';
                img.style.verticalAlign = 'middle';
                // Adjust margin to help line-height and bounding box on canvas rendering
                img.style.margin = '0 5px';
            } else {
                img.style.display = 'block';
                img.style.margin = '10px auto';
            }

            el.parentNode?.replaceChild(img, el);`;

content = content.replace(/            const dataUrl = canvas\.toDataURL\('image\/png'\);[\s\S]*?el\.parentNode\?\.replaceChild\(img, el\);/, imgGen);

fs.writeFileSync('src/App.tsx', content);
