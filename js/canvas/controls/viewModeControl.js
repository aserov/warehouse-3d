window.WH = window.WH || {};
WH.canvas = WH.canvas || {};

WH.canvas.ViewModeControl = (function() {
  const MODE_BUTTONS = { 'btn-2d': '2d', 'btn-3d': '3d', 'btn-fps': 'fps' };

  function setActiveMode(mode) {
    Object.entries(MODE_BUTTONS).forEach(([btnId, btnMode]) => {
      document.getElementById(btnId)?.classList.toggle('active', btnMode === mode);
    });

    document.getElementById('fps-scanner-overlay').classList.toggle('hidden', mode !== 'fps');
  }

  function bindModeButtons() {
    Object.entries(MODE_BUTTONS).forEach(([btnId, mode]) => {
      document.getElementById(btnId)?.addEventListener('click', () => {
        WH.webgl.SceneController.setViewMode(mode);
      });
    });

    WH.events.on('scene:viewModeChange', setActiveMode);
  }

  function updateFullscreenIcon() {
    const btn = document.getElementById('btn-fullscreen');
    if (!btn) return;
    const isFullscreen = !!document.fullscreenElement;

    btn.classList.toggle('active', isFullscreen);
    btn.querySelector('.icon-expand').style.display = isFullscreen ? 'none' : '';
    btn.querySelector('.icon-compress').style.display = isFullscreen ? '' : 'none';
  }

  function bindFullscreen() {
    const fullscreenRoot = document.getElementById('main-layout'); // а не canvas-container
    document.getElementById('btn-fullscreen')?.addEventListener('click', () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        fullscreenRoot?.requestFullscreen();
      }
    });
    document.addEventListener('fullscreenchange', updateFullscreenIcon);
  }

  function bindReset() {
    document.getElementById('btn-reset-view')?.addEventListener('click', () => {
      WH.canvas.WarehouseDataStore.selectArea(WH.canvas.WarehouseDataStore.ALL_AREAS);
      WH.webgl.SceneController.clearSelection();
      WH.webgl.SceneController.resetViewMode();
      WH.canvas.CellSearch.reset();
    });
  }

  function init() {
    bindModeButtons();
    bindFullscreen();
    bindReset();
  }

  return { init };
})();