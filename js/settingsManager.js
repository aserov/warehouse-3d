window.Warehouse = window.Warehouse || {};

window.Warehouse.SettingsManager = (function() {
  const SETTINGS_KEY = 'warehouse_ui_settings';

  const SETTING_CHECKBOX_IDS = [
    'toggle-area-labels',
    'toggle-row-labels',
    'toggle-level-labels',
    'toggle-corner-labels',
    'toggle-canvas-viewer',
    'toggle-compass',
    'toggle-zoom'
  ];

  /**
   * Saves current checkbox states to localStorage.
   */
  function saveSettings() {
    const settings = {};
    SETTING_CHECKBOX_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) settings[id] = el.checked;
    });
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  /**
   * Applies current checkbox states to both 3D scene objects and DOM widgets.
   */
  function applySettings() {
    const Builder = window.Warehouse?.Builder;

    // Helper to toggle visibility of 3D object arrays or DOM elements
    const toggleGroup = (checkboxId, items) => {
      const el = document.getElementById(checkboxId);
      if (!el || !items) return;

      const isVisible = el.checked;
      items.forEach(item => {
        if (item.isObject3D) {
          item.visible = isVisible;
        } else if (item.style) {
          item.style.display = isVisible ? '' : 'none';
        }
      });
    };

    // 1. 3D Canvas Labels
    if (Builder) {
      toggleGroup('toggle-area-labels', Builder.areaLabels);
      toggleGroup('toggle-row-labels', Builder.rowLabels);
      toggleGroup('toggle-level-labels', Builder.levelLabels);
      toggleGroup('toggle-corner-labels', Builder.cornerLabels);
    }

    // 2. DOM Overlay Widgets
    const compassWidget = document.getElementById('compass-widget');
    const compassToggle = document.getElementById('toggle-compass');
    if (compassWidget && compassToggle) {
      compassWidget.style.display = compassToggle.checked ? 'flex' : 'none';
    }

    const zoomWidget = document.getElementById('zoom-widget');
    const zoomToggle = document.getElementById('toggle-zoom');
    if (zoomWidget && zoomToggle) {
      zoomWidget.style.display = zoomToggle.checked ? 'flex' : 'none';
    }

    const viewerWidget = document.getElementById('canvas-viewer-widget');
    const viewerToggle = document.getElementById('toggle-canvas-viewer');
    if (viewerWidget && viewerToggle) {
      viewerWidget.style.display = viewerToggle.checked ? 'flex' : 'none';
    }
  }

  /**
   * Restores saved checkbox states from localStorage.
   */
  function restoreSettings() {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return;

    try {
      const settings = JSON.parse(saved);
      SETTING_CHECKBOX_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el && settings[id] !== undefined) {
          el.checked = settings[id];
        }
      });
    } catch (err) {
      console.error('[SettingsManager] Failed to restore settings:', err);
    }
  }

  /**
   * Initializes change listeners and restores settings.
   */
  function init() {
    restoreSettings();

    // Attach listener to save and apply settings whenever a checkbox changes
    SETTING_CHECKBOX_IDS.forEach(id => {
      document.getElementById(id)?.addEventListener('change', () => {
        saveSettings();
        applySettings();
      });
    });

    applySettings();
  }

  return {
    init,
    saveSettings,
    restoreSettings,
    applySettings
  };
})();
