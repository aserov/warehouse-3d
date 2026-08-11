window.WH = window.WH || {};
WH.ui = WH.ui || {};

WH.ui.CanvasLoader = (function() {
  let loaderElement = null;

  function getElement() {
    if (!loaderElement) loaderElement = document.getElementById('canvas-loader');
    return loaderElement;
  }

  return {
    show() {
      getElement()?.classList.remove('hidden');
    },

    hide() {
      const el = getElement();
      if (!el) return;
      
      requestAnimationFrame(() => {
        el.classList.add('hidden');
      });
    }
  };
})();