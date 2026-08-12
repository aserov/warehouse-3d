window.WH = window.WH || {};
WH.canvas = WH.canvas || {};

WH.canvas.ZoomControl = (function() {
  const ZOOM_STEP = 10;
  let zoom = 50;

  function applyZoom(value) {
    zoom = Math.min(100, Math.max(0, value));
    const slider = document.getElementById('zoom-slider');
    if (slider) slider.value = zoom;
    WH.webgl.SceneController.setZoom(zoom);
  }

  // Called when the camera distance changes from outside this control
  // (e.g. mouse-wheel zoom via OrbitControls) — updates the UI only,
  // does not touch the camera, to avoid a feedback loop.
  function syncFromScene(percent) {
    zoom = Math.min(100, Math.max(0, percent));
    const slider = document.getElementById('zoom-slider');
    if (slider) slider.value = zoom;
  }

  function init() {
    document.getElementById('zoom-slider')?.addEventListener('input', (e) => applyZoom(Number(e.target.value)));
    document.getElementById('zoom-out-btn')?.addEventListener('click', () => applyZoom(zoom - ZOOM_STEP));
    document.getElementById('zoom-in-btn')?.addEventListener('click', () => applyZoom(zoom + ZOOM_STEP));

    WH.events.on('scene:zoomChange', syncFromScene);
  }

  return { init };
})();