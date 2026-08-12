window.WH = window.WH || {};
WH.canvas = WH.canvas || {};

WH.canvas.CameraPositionControl = (function() {
    function formatVec(v) {
    return `x=${v.x.toFixed(1)}; y=${v.y.toFixed(1)}; z=${v.z.toFixed(1)}`;
  }

  function update({ position, target }) {
    const posEl = document.getElementById('camera-coords');
    const targetEl = document.getElementById('target-coords');
    if (posEl) posEl.textContent = formatVec(position);
    if (targetEl) targetEl.textContent = formatVec(target);
  }

  function init() {
    if (!document.getElementById('camera-position-widget')) return;
    WH.events.on('scene:cameraChange', update);
  }

  return { init };
})();
