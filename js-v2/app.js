window.WH = window.WH || {};

document.addEventListener('DOMContentLoaded', () => {
  WH.utils.applyTranslations();

  if (WH.ToolbarClock) WH.ToolbarClock.start();
  if (WH.sidebar.SettingsToggles) WH.sidebar.SettingsToggles.init();
  if (WH.sidebar.Accordion) WH.sidebar.Accordion.init();
  if (WH.sidebar.InfoPanel) WH.sidebar.InfoPanel.init();
  if (WH.canvas.FiltersDropdown) WH.canvas.FiltersDropdown.init();
  if (WH.canvas.CellSearch) WH.canvas.CellSearch.init();

  WH.events.on('warehouseData:change', (state) => {
    if (state.error) WH.ui.ErrorBanner.show(WH.utils.t('errorTitle'), state.error);
  });

  WH.canvas.SceneSync.init(document.getElementById('canvas-container'));
  WH.canvas.WarehouseDataStore.load();

  if (WH.canvas.CompassControl) WH.canvas.CompassControl.init();
  if (WH.canvas.ZoomControl) WH.canvas.ZoomControl.init();
  if (WH.canvas.ViewModeControl) WH.canvas.ViewModeControl.init();

  if (WH.ui.CanvasLoader) WH.ui.CanvasLoader.hide();
});