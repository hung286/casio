/**
 * Casio fx-580VN X - Standalone Web App Builder
 * Bundles HTML, CSS, Base64 TrueType Font (ES03.TTF), and all JavaScript engines
 * into 100% self-contained, offline-ready single HTML files.
 */

const fs = require('fs');
const path = require('path');

console.log('--- Starting Casio fx-580VN X Standalone Web App Build ---');

// 1. Read Font and convert to Base64
const fontPath = path.join(__dirname, 'fonts', 'ES03.TTF');
const fontBuffer = fs.readFileSync(fontPath);
const fontBase64 = fontBuffer.toString('base64');
console.log(`✓ Read ES03.TTF (${fontBuffer.length} bytes -> ${fontBase64.length} base64 chars)`);

// 2. Read and prepare CSS
const cssPath = path.join(__dirname, 'css', 'calculator.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

// Replace relative font url with inline base64 Data URI
const fontDataUri = `url('data:font/ttf;base64,${fontBase64}') format('truetype')`;
cssContent = cssContent.replace(/url\(['"]?\.\.\/fonts\/ES03\.TTF['"]?\)\s*format\(['"]?truetype['"]?\)/g, fontDataUri);
cssContent = cssContent.replace(/url\(['"]?\.\.\/fonts\/ES03\.TTF['"]?\)/g, fontDataUri);

console.log(`✓ Prepared CSS (${cssContent.length} chars, font inlined)`);

// 3. Read JavaScript engines in dependency order
const jsFiles = [
    'calc-engine.js',
    'solvers.js',
    'math-tree.js',
    'classwiz-modes.js',
    'ui.js'
];

let jsBundle = '';
for (const file of jsFiles) {
    const fPath = path.join(__dirname, 'js', file);
    const content = fs.readFileSync(fPath, 'utf8');
    jsBundle += `\n/* ==================== JS Engine: ${file} ==================== */\n` + content + '\n';
    console.log(`✓ Bundled js/${file} (${content.length} chars)`);
}

// 4. Read index_modular.html as the HTML template
const modularPath = path.join(__dirname, 'index_modular.html');
const templateHtml = fs.readFileSync(modularPath, 'utf8');

// 5. Assemble Standalone Single-File HTML
let standaloneHtml = templateHtml;

// Replace CSS link with inline <style> using a function to avoid $-replacement issues
const cssLinkRegex = /<link\s+rel=["']stylesheet["']\s+href=["']css\/calculator\.css["']\s*\/?>/i;
const inlineStyleBlock = `<style>\n${cssContent}\n    </style>`;
if (cssLinkRegex.test(standaloneHtml)) {
    standaloneHtml = standaloneHtml.replace(cssLinkRegex, () => inlineStyleBlock);
} else {
    standaloneHtml = standaloneHtml.replace('</head>', () => `    ${inlineStyleBlock}\n</head>`);
}

// Replace script tags with inline <script> using a function to avoid $-replacement issues
const scriptTagsRegex = /<!-- Scripts -->\s*(<script\s+src=["']js\/[^"']+["']><\/script>\s*)+/i;
const inlineScriptBlock = `<!-- Embedded All-In-One Scripts (Offline Standalone) -->\n    <script>\n${jsBundle}\n    </script>`;

if (scriptTagsRegex.test(standaloneHtml)) {
    standaloneHtml = standaloneHtml.replace(scriptTagsRegex, () => inlineScriptBlock);
} else {
    standaloneHtml = standaloneHtml.replace('</body>', () => `    ${inlineScriptBlock}\n</body>`);
}

// 6. Write standalone outputs
const standaloneFile = path.join(__dirname, 'casio580_standalone.html');
fs.writeFileSync(standaloneFile, standaloneHtml, 'utf8');
console.log(`✓ Generated casio580_standalone.html (${standaloneHtml.length} bytes)`);

// Also update index.html to be the standalone version
fs.writeFileSync(path.join(__dirname, 'index.html'), standaloneHtml, 'utf8');
console.log(`✓ Updated index.html with standalone bundle (${standaloneHtml.length} bytes)`);

console.log('--- Build Successfully Completed! ---');
