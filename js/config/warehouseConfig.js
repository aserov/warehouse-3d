window.WH = window.WH || {};
WH.config = WH.config || {};

WH.config.defaultLang = 'ru'; // `'en' | 'ru'

WH.config.WAREHOUSE_CONFIG = {
  camera: {
    fov: 60,
    near: 1.0,
    far: 2000,
    maxPolarAngle: Math.PI / 2 - 0.03,
    minDistance: 2,
    maxDistance: 1200,
    fps: {
      eyeHeight: 2.0,
      moveSpeed: 20.0,
      sprintMultiplier: 2.0,
      lookSensitivity: 0.002,
      transitionDuration: 600,
    },
  },
  colors: {
    bg: 0xbdc3c7,
    gridSection: 0xe2e7ec,
    gridBorder: 0x8c9b9e,
    buildingWall: 0x34495e,
    buildingFloor: 0xffffff,
    selection: 0xffd700,
    areaPalette: [
      0xd32f2f, 0x2e7d32, 0xef6c00, 0x8e24aa, 0x00838f, 0xf57c00, 0x1976d2, 0x388e3c, 0xc2185b,
      0x7b1fa2, 0xe64a19, 0x0097a7, 0xf9a825, 0x5d4037,
    ],
  },
  grid: {
    positionY: -0.05,
  },
  focus: {
    dimmedOpacity: 0.15,
    paddingFactor: 1.4,
  },
  areaPadding: 10.0,
  cellGap: 0.2,
};