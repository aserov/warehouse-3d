window.WH = window.WH || {};
WH.ui = WH.ui || {};

WH.ui.CanvasVisibility = (function() {
  const HIDDEN_SELECTORS = [
    '#canvas-container canvas',   // three.js renderer <canvas>
    '.canvas-controls-left',      // compass + zoom
    '.canvas-controls-right',     // view mode + filters (warehouse/floor/area/search)
  ];

  function setHidden(hidden) {
    HIDDEN_SELECTORS.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        el.style.visibility = hidden ? 'hidden' : '';
      });
    });
  }

  return { setHidden };
})();