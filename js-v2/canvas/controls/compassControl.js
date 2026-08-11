window.WH = window.WH || {};
WH.canvas = WH.canvas || {};

WH.canvas.CompassControl = (function() {
  const DIRECTION_BY_CLASS = { 'btn-n': 'n', 'btn-e': 'e', 'btn-s': 's', 'btn-w': 'w' };

  function updateNeedle(azimuthDeg) {
    const arrow = document.getElementById('compass-arrow');
    if (arrow) arrow.style.transform = `rotate(${-azimuthDeg}deg)`;
  }

  function init() {
    document.querySelectorAll('.compass-btn').forEach((btn) => {
      const directionClass = Array.from(btn.classList).find((c) => DIRECTION_BY_CLASS[c]);
      const direction = directionClass && DIRECTION_BY_CLASS[directionClass];
      if (!direction) return;

      btn.addEventListener('click', () => {
        WH.webgl.SceneController.rotateToCompass(direction);
      });
    });

    WH.events.on('scene:azimuthChange', updateNeedle);
  }

  return { init };
})();