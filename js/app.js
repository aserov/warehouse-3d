window.WH = window.WH || {};

document.addEventListener('DOMContentLoaded', () => {
  WH.utils.applyTranslations();

  if (WH.toolbar.Clock) WH.toolbar.Clock.start();
  if (WH.sidebar.SettingsToggles) WH.sidebar.SettingsToggles.init();
  if (WH.sidebar.Accordion) WH.sidebar.Accordion.init();
  if (WH.sidebar.InfoPanel) WH.sidebar.InfoPanel.init();

  __initData();

  if (WH.canvas.FiltersDropdown) WH.canvas.FiltersDropdown.init();
  if (WH.canvas.CellSearch) WH.canvas.CellSearch.init();
  if (WH.canvas.CompassControl) WH.canvas.CompassControl.init();
  if (WH.canvas.ZoomControl) WH.canvas.ZoomControl.init();
  if (WH.canvas.ViewModeControl) WH.canvas.ViewModeControl.init();
  if (WH.canvas.CameraPositionControl) WH.canvas.CameraPositionControl.init();
});

function __initData() {
  WH.events.on('warehouseData:change', (state) => {
    if (state.error) {
      WH.ui.ErrorBanner.show(WH.utils.t('errorTitle'), state.error);
    } else {
      WH.ui.ErrorBanner.hide();
    }

    if (WH.ui.CanvasVisibility) {
      WH.ui.CanvasVisibility.setHidden(!!state.error);
    }

    if (WH.ui.CanvasLoader) {
      state.loading ? WH.ui.CanvasLoader.show() : WH.ui.CanvasLoader.hide();
    }
  });

  WH.canvas.SceneSync.init(document.getElementById('canvas-container'));
  WH.canvas.WarehouseDataStore.load();
}
