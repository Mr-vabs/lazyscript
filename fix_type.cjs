const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/type TextSegment = \{ type: SegmentType, text\?: string, src\?: string, width\?: number, height\?: number, tableData\?: \{ rows: TableRow\[\], colWidths: number\[\], totalWidth: number \}, color\?: string, isBold\?: boolean, isUnderline\?: boolean, align\?: AlignType, isCodeLine\?: boolean, isInline\?: boolean \};\n/g, "");

fs.writeFileSync('src/App.tsx', content);
