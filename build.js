// build.js
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

// IMPORTANT: Order matters! Must match the order in index.html
const files = [
  'js/i18n/ru.js',
  'js/i18n/en.js',

  'js/config/enums.js',
  'js/config/warehouseConfig.js',
  'js/config/settingsConfig.js',

  'js/utils/color.js',
  'js/utils/format.js',
  'js/utils/scale.js',
  'js/utils/metrics.js',
  'js/utils/i18n.js',
  'js/utils/eventBus.js',

  'js/webgl/builders/textures.js',
  'js/webgl/builders/cellBuilder.js',
  'js/webgl/builders/levelBuilder.js',
  'js/webgl/builders/rowBuilder.js',
  'js/webgl/builders/areaBuilder.js',
  'js/webgl/builders/floorBuilder.js',
  'js/webgl/builders/geometryBuilder.js',
  'js/webgl/builders/selection.js',

  'js/webgl/core/cameraAnimator.js',
  'js/webgl/core/cameraControls.js',
  'js/webgl/core/gridController.js',
  'js/webgl/core/sceneSetup.js',
  'js/webgl/core/selectionInteraction.js',
  'js/webgl/core/fpsController.js',
  'js/webgl/core/viewModeController.js',
  'js/webgl/core/sceneController.js',

  'js/ui/errorBanner.js',
  'js/ui/canvasLoader.js',
  'js/ui/canvasVisibility.js',

  'js/api/warehouseMock.js',
  'js/api/warehouseApi.js',

  'js/canvas/warehouseDataStore.js',
  'js/canvas/controls/filtersDropdown.js',
  'js/canvas/controls/cellSearch.js',
  'js/canvas/controls/compassControl.js',
  'js/canvas/controls/zoomControl.js',
  'js/canvas/controls/viewModeControl.js',
  'js/canvas/sceneSync.js',

  'js/toolbar/toolbarClock.js',
  'js/sidebar/settingsToggles.js',
  'js/sidebar/settingsStore.js',
  'js/sidebar/accordion.js',

  'js/sidebar/info/helper.js',
  'js/sidebar/info/infoFloor.js',
  'js/sidebar/info/infoArea.js',
  'js/sidebar/info/infoRow.js',
  'js/sidebar/info/infoCell.js',
  'js/sidebar/info/infoLevel.js',
  'js/sidebar/infoPanel.js',

  'js/app.js'
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