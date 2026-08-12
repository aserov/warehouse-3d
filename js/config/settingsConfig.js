window.WH = window.WH || {};
WH.config = WH.config || {};

WH.config.SETTINGS_DEFAULTS = {
  floorLabels: true,
  areaLabels: true,
  rowLabels: true,
  levelLabels: true,
  cornerLabels: false,
  canvasViewer: true,
  compass: true,
  zoom: true,
  cameraPosition: false,
};

WH.config.SETTINGS_CHECKBOX_MAP = {
  floorLabels: 'toggle-floor-labels',
  areaLabels: 'toggle-area-labels',
  rowLabels: 'toggle-row-labels',
  levelLabels: 'toggle-level-labels',
  cornerLabels: 'toggle-corner-labels',
  canvasViewer: 'toggle-canvas-viewer',
  compass: 'toggle-compass',
  zoom: 'toggle-zoom',
  cameraPosition: 'toggle-camera-position',
};

WH.config.SETTINGS_DOM_WIDGETS = {
  canvasViewer: 'canvas-viewer-widget',
  compass: 'compass-widget',
  zoom: 'zoom-widget',
  cameraPosition: 'camera-position-widget',
};
