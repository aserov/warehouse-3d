// build-css.js
const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');

// IMPORTANT: Order matters! Must match the order in index.html
const cssFiles = [
  'css/base.css',
  'css/toolbar.css',
  'css/sidebar.css',
  'css/compass.css',
  'css/zoom.css',
  'css/controls.css',
  'css/fps.css',
  'css/components.css'
];

console.log('📦 Reading CSS files...');

let combinedCSS = '';
let loadedCount = 0;

for (const file of cssFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    combinedCSS += content + '\n';
    loadedCount++;
    console.log('✅ Loaded: ' + file);
  } else {
    console.warn('⚠️  File not found: ' + file);
  }
}

console.log('✅ Loaded ' + loadedCount + ' of ' + cssFiles.length + ' files');

const originalSize = (combinedCSS.length / 1024).toFixed(2);
console.log('📊 Original size: ' + originalSize + ' KB');

// Create dist folder if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Save unminified version (for development)
fs.writeFileSync('dist/warehouse.css', combinedCSS);
console.log('✅ Saved: dist/warehouse.css (' + originalSize + ' KB)');

// Minify with clean-css
console.log('🔨 Minifying CSS with clean-css...');

try {
  const output = new CleanCSS({
    level: {
      1: {
        all: true,
        removeWhitespace: true,
        removeEmpty: true,
        removeEmptyRules: true
      },
      2: {
        all: true,
        mergeMedia: true,
        mergeRules: true,
        restructureRules: true,
        removeDuplicateRules: true
      }
    },
    compatibility: {
      properties: {
        zeroUnits: true,
        vendorPrefixes: true
      }
    },
    format: false,
    sourceMap: false  // Disable sourceMap to avoid error
  }).minify(combinedCSS);

  if (output.errors.length > 0) {
    console.warn('⚠️  CSS errors:', output.errors);
  }

  if (output.warnings.length > 0) {
    console.warn('⚠️  CSS warnings:', output.warnings);
  }

  // Save minified version
  fs.writeFileSync('dist/warehouse.min.css', output.styles);
  
  const minifiedSize = (output.styles.length / 1024).toFixed(2);
  const reduction = (100 - (output.styles.length / combinedCSS.length * 100)).toFixed(1);
  
  console.log('✅ Minified: dist/warehouse.min.css (' + minifiedSize + ' KB)');
  console.log('📊 ' + originalSize + 'KB → ' + minifiedSize + 'KB (' + reduction + '% smaller)');
  console.log('\n✨ CSS build complete!');
  
} catch (error) {
  console.error('❌ CleanCSS error:', error.message);
  console.log('💡 Falling back to simple minification...');
  
  // Simple minification as fallback (remove comments and whitespace)
  let minifiedCSS = combinedCSS
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove whitespace around brackets
    .replace(/\s*([{}:;,])\s*/g, '$1')
    // Remove extra semicolons
    .replace(/;}/g, '}')
    // Remove whitespace at start/end
    .trim();
  
  fs.writeFileSync('dist/warehouse.min.css', minifiedCSS);
  
  const minifiedSize = (minifiedCSS.length / 1024).toFixed(2);
  const reduction = (100 - (minifiedCSS.length / combinedCSS.length * 100)).toFixed(1);
  
  console.log('✅ Minified (simple): dist/warehouse.min.css (' + minifiedSize + ' KB)');
  console.log('📊 ' + originalSize + 'KB → ' + minifiedSize + 'KB (' + reduction + '% smaller)');
  console.log('\n✨ CSS build complete with simple minification!');
}