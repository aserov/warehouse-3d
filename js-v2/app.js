window.WH = window.WH || {};

document.addEventListener('DOMContentLoaded', () => {
  WH.utils.applyTranslations();

  if (WH.ToolbarClock) WH.ToolbarClock.start();
  if (WH.sidebar.SettingsToggles) WH.sidebar.SettingsToggles.init();
  if (WH.sidebar.Accordion) WH.sidebar.Accordion.init();
  if (WH.canvas.FiltersDropdown) WH.canvas.FiltersDropdown.init();

  WH.events.on('warehouseData:change', (state) => {
    if (state.error) {
      WH.ui.ErrorBanner.show(WH.utils.t('errorTitle'), state.error);
    }
  });
  WH.canvas.WarehouseDataStore.load();

  if (WH.ui.CanvasLoader) WH.ui.CanvasLoader.hide();
});