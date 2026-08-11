// build.js
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

// IMPORTANT: Order matters! Must match the order in index.html
const files = [
  'js-v2/i18n/ru.js',
  'js-v2/i18n/en.js',

  'js-v2/config/enums.js',
  'js-v2/config/warehouseConfig.js',
  'js-v2/config/settingsConfig.js',

  'js-v2/utils/color.js',
  'js-v2/utils/format.js',
  'js-v2/utils/scale.js',
  'js-v2/utils/metrics.js',
  'js-v2/utils/i18n.js',
  'js-v2/utils/eventBus.js',

  'js-v2/webgl/builders/textures.js',
  'js-v2/webgl/builders/cellBuilder.js',
  'js-v2/webgl/builders/levelBuilder.js',
  'js-v2/webgl/builders/rowBuilder.js',
  'js-v2/webgl/builders/areaBuilder.js',
  'js-v2/webgl/builders/floorBuilder.js',
  'js-v2/webgl/builders/geometryBuilder.js',
  'js-v2/webgl/builders/selection.js',

  'js-v2/webgl/core/cameraAnimator.js',
  'js-v2/webgl/core/cameraControls.js',
  'js-v2/webgl/core/gridController.js',
  'js-v2/webgl/core/sceneSetup.js',
  'js-v2/webgl/core/selectionInteraction.js',
  'js-v2/webgl/core/fpsController.js',
  'js-v2/webgl/core/viewModeController.js',
  'js-v2/webgl/core/sceneController.js',

  'js-v2/ui/errorBanner.js',
  'js-v2/ui/canvasLoader.js',

  'js-v2/api/warehouseMock.js',
  'js-v2/api/warehouseApi.js',

  'js-v2/canvas/warehouseDataStore.js',
  'js-v2/canvas/controls/filtersDropdown.js',
  'js-v2/canvas/controls/cellSearch.js',
  'js-v2/canvas/controls/compassControl.js',
  'js-v2/canvas/controls/zoomControl.js',
  'js-v2/canvas/controls/viewModeControl.js',
  'js-v2/canvas/sceneSync.js',

  'js-v2/toolbar/toolbarClock.js',
  'js-v2/sidebar/settingsToggles.js',
  'js-v2/sidebar/settingsStore.js',
  'js-v2/sidebar/accordion.js',

  'js-v2/sidebar/info/helper.js',
  'js-v2/sidebar/info/infoFloor.js',
  'js-v2/sidebar/info/infoArea.js',
  'js-v2/sidebar/info/infoRow.js',
  'js-v2/sidebar/info/infoCell.js',
  'js-v2/sidebar/info/infoLevel.js',
  'js-v2/sidebar/infoPanel.js',

  'js-v2/app.js'
];

console.log('📦 Reading files...');

let combinedCode = '';
let loadedCount = 0;

for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    combinedCode += fs.readFileSync(filePath, 'utf8') + '\n';
    loadedCount++;
  } else {
    console.warn('⚠️  File not found: ' + file);
  }
}

console.log('✅ Loaded ' + loadedCount + ' of ' + files.length + ' files');
console.log('📊 Original size: ' + (combinedCode.length / 1024).toFixed(2) + ' KB');

// Create dist folder
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

console.log('🔨 Minifying with terser...');

// Minify with terser
minify(combinedCode, {
  compress: {
    drop_console: false,
    drop_debugger: true,
    passes: 2,
    unsafe: true,
    unsafe_arrows: true,
    unsafe_comps: true,
    unsafe_methods: true,
    unsafe_proto: true,
    unsafe_regexp: true,
    unsafe_undefined: true
  },
  mangle: {
    reserved: ['THREE'],
    toplevel: true,
    keep_fnames: false
  },
  output: {
    comments: false,
    beautify: false,
    semicolons: true,
    indent_level: 0
  },
  sourceMap: {
    filename: 'app.warehouse.min.js',
    url: 'app.warehouse.min.js.map'
  }
}).then(result => {
  if (result.code) {
    // Save unminified version (for development)
    fs.writeFileSync('dist/app.warehouse.js', combinedCode);
    console.log('✅ Saved: dist/app.warehouse.js (' + (combinedCode.length / 1024).toFixed(2) + ' KB)');
    
    // Save minified version (for production)
    fs.writeFileSync('dist/app.warehouse.min.js', result.code);
    
    // Save source map
    if (result.map) {
      fs.writeFileSync('dist/app.warehouse.min.js.map', result.map);
      console.log('🗺️  Saved: dist/app.warehouse.min.js.map');
    }
    
    const minifiedSize = (result.code.length / 1024).toFixed(2);
    const reduction = (100 - (result.code.length / combinedCode.length * 100)).toFixed(1);
    
    console.log('✅ Minified: dist/app.warehouse.min.js (' + minifiedSize + ' KB)');
    console.log('📊 ' + (combinedCode.length / 1024).toFixed(2) + 'KB → ' + minifiedSize + 'KB (' + reduction + '% smaller)');
    console.log('\n✨ Build complete!');
  } else {
    console.error('❌ Minification failed');
  }
}).catch(err => {
  console.error('❌ Error during minification:', err.message);
});