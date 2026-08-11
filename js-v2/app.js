window.WH = window.WH || {};

document.addEventListener('DOMContentLoaded', () => {
  if (WH.ToolbarClock) WH.ToolbarClock.start();
  if (WH.sidebar.SettingsToggles) WH.sidebar.SettingsToggles.init();
});