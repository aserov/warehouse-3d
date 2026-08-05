window.Warehouse = window.Warehouse || {};

window.Warehouse.CONFIG = {
  // --- Language Settings ---
  defaultLang: 'ru', // 'ru' | 'en'

  // --- Scale & Physics ---
  scaleFactor: 0.001, // 10000 mm in JSON -> 10 units (meters)
  
  // --- Grid & Layout Gaps (meters) ---
  cellGap: 0.5,
  rowGap: 15.0,
  areaGap: 25.0,        // Minimum gap between areas
  areaPadding: 8.0,      // Inner margin inside an area border
  originX: 15,           // Offset of the first area from the left wall
  originZ: 15,           // Offset of the first area from the top wall

  // --- Warehouse Building Outline (L-shaped Polygon coordinates in meters: [X, Z]) ---
  // L-shaped building outline defined by 6 vertices
  buildingPolygon: [
    { x: 0,   z: 0 },
    { x: 420, z: 0 },
    { x: 420, z: 180 },
    { x: 280, z: 180 },
    { x: 280, z: 530 },
    { x: 0,   z: 530 }
  ],

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
      "#00838f"  // Cyan
    ]
  }
};