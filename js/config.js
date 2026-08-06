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
    minDistance: 5,
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
    size: 2500,          // Grid plane extent
    divisions: 250,      // Division density across the grid
    positionY: -0.05,    // Y offset below ground plane to eliminate Z-fighting
    centerX: 200,
    centerZ: 250
  },

  // --- Grid & Layout Gaps (meters) ---
  cellGap: 0.5,
  rowGap: 15.0,
  areaGap: 0.0,        // Minimum gap between areas
  areaPadding: 8.0,      // Inner margin inside an area border
  originX: 15,           // Offset of the first area from the left wall
  originZ: 15,           // Offset of the first area from the top wall

  // --- Warehouse Building Outline ---
  // NOTE: buildingPolygon is intentionally NOT defined here anymore.
  // It always comes from the server per-warehouse (warehouse.polygon) and is
  // assigned onto this object at runtime (see app.js -> selectWarehouse()).
  // If a warehouse has no polygon, that's treated as a data error - nothing is drawn.
  buildingPolygon: null,

  // --- Colors & Themes ---
  colors: {
    inactive: 0x8c9b9e,
    selection: 0xffd700,
    bg: 0xdfe4ea,
    floor: 0xffffff,
    buildingWall: 0x34495e,
    buildingFloor: 0xe9ecef,
    gridMain: 0xb0b8c4,
    gridSection: 0xe2e7ec,
    areaPalette: [
      "#3f51b5", // Indigo
      "#2e7d32", // Emerald Green
      "#ef6c00", // Warm Orange
      "#8e24aa", // Purple
      "#00838f", // Cyan
      "#d32f2f", // Red
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
