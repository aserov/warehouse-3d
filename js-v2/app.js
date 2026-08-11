window.WH = window.WH || {};

document.addEventListener('DOMContentLoaded', () => {
  if (WH.ToolbarClock) WH.ToolbarClock.start();
  if (WH.sidebar.SettingsToggles) WH.sidebar.SettingsToggles.init();
  if (WH.sidebar.Accordion) WH.sidebar.Accordion.init();
  
  if (WH.ui.CanvasLoader) WH.ui.CanvasLoader.hide();
});