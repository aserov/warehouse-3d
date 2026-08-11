window.WH = window.WH || {};
WH.sidebar = WH.sidebar || {};

WH.sidebar.SettingsToggles = (function() {
  function applyDomWidget(key, value) {
    const widgetId = WH.config.SETTINGS_DOM_WIDGETS[key];
    if (!widgetId) return;
    const widget = document.getElementById(widgetId);
    if (widget) widget.style.display = value ? 'flex' : 'none';
  }

  function syncFromStore() {
    const settings = WH.sidebar.SettingsStore.getAll();
    Object.entries(WH.config.SETTINGS_CHECKBOX_MAP).forEach(([key, checkboxId]) => {
      const checkbox = document.getElementById(checkboxId);
      if (checkbox) checkbox.checked = settings[key];
      applyDomWidget(key, settings[key]);
    });
  }

  function bindCheckboxes() {
    Object.entries(WH.config.SETTINGS_CHECKBOX_MAP).forEach(([key, checkboxId]) => {
      document.getElementById(checkboxId)?.addEventListener('change', () => {
        WH.sidebar.SettingsStore.toggle(key);
      });
    });
  }

  function init() {
    syncFromStore();
    bindCheckboxes();

    WH.events.on('settings:change', ({ key, value }) => applyDomWidget(key, value));
  }

  return { init };
})();