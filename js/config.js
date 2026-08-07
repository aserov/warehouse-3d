window.Warehouse = window.Warehouse || {};

window.Warehouse.CONFIG = {
  // --- Language Settings ---
  defaultLang: 'en', // 'ru' | 'en'

  // --- Scale & Physics ---
  // Fallback used ONLY when a warehouse from the server doesn't provide its own `scale`.
  // Not a source of truth anymore - each warehouse should send its own scale.
  scaleFactor: 0.001, // 10000 mm in JSON -> 10 units (meters)

  // --- Camera & View Controls ---
  camera: {
    fov: 60,
    near: 1.0,           // High near-plane precision prevents depth buffer flickering
    far: 2000,
    maxPolarAngle: Math.PI / 2 - 0.03, // Blocks camera from looking under floor (~88 deg)
    minDistance: 2,
    maxDistance: 1200
  },

  // --- Area Focus & Dimming Settings ---
  focus: {
    dimmedOpacity: 0.15,       // Opacity for inactive areas when focusing on a specific zone
    animationDuration: 1000,   // Camera fly animation duration (in milliseconds)
    paddingFactor: 1.4         // Framing offset multiplier around focused area bounds
  },

  // --- Floor Grid Configuration ---
  grid: {
    positionY: -0.05,    // Y offset below ground plane to eliminate Z-fighting
  },

  // --- Grid & Layout Gaps (meters) ---
  cellGap: 0.5,
  rowGap: 15.0,
  areaGap: 0.0,          // Minimum gap between areas
  areaPadding: 10.0,      // Inner margin inside an area border
  originX: 0,           // Offset of the first area from the left wall
  originZ: 0,           // Offset of the first area from the top wall

  // --- Colors & Themes ---
  colors: {
    inactive: 0x8c9b9e,
    selection: 0xffd700,
    bg: 0xbdc3c7, // 0x8c9b9e,
    floor: 0xffffff,
    buildingWall: 0x34495e,
    buildingFloor: 0xffffff,
    gridMain: 0xb0b8c4,
    gridSection: 0xe2e7ec,
    gridBorder: 0x8c9b9e,
    areaPalette: [
      "#d32f2f", // Red
      "#2e7d32", // Emerald Green
      "#ef6c00", // Warm Orange
      "#8e24aa", // Purple
      "#00838f", // Cyan
      "#f57c00", // Amber
      "#1976d2", // Bright Blue
      "#388e3c", // Forest Green
      "#c2185b", // Raspberry
      "#7b1fa2", // Deep Purple
      "#e64a19", // Vermillion
      "#0097a7", // Teal
      "#f9a825", // Golden Yellow
      "#5d4037"  // Brown
    ]
  }
};
