window.WH = window.WH || {};
WH.sidebar = WH.sidebar || {};

WH.sidebar.SettingsStore = (function() {
  const STORAGE_KEY = 'warehouse-viewer:settings';

  let settings = readStored();

  function readStored() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...WH.config.SETTINGS_DEFAULTS };
      return { ...WH.config.SETTINGS_DEFAULTS, ...JSON.parse(raw) };
    } catch {
      return { ...WH.config.SETTINGS_DEFAULTS };
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (err) {
      console.warn('[SettingsStore] Failed to persist settings', err);
    }
  }

  function getAll() {
    return { ...settings };
  }

  function toggle(key) {
    settings = { ...settings, [key]: !settings[key] };
    persist();
    WH.events.emit('settings:change', { key, value: settings[key] });
  }

  return { getAll, toggle };
})();