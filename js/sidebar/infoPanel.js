window.WH = window.WH || {};
WH.sidebar = WH.sidebar || {};

WH.sidebar.InfoPanel = (function() {
  const RENDERERS = {
    floor: () => WH.sidebar.info.renderFloor,
    area: () => WH.sidebar.info.renderArea,
    row: () => WH.sidebar.info.renderRow,
    level: () => WH.sidebar.info.renderLevel,
    cell: () => WH.sidebar.info.renderCell,
  };

  function render(userData) {
    const infoContent = document.getElementById('info-content');
    if (!infoContent) return;

    if (!userData || !userData.type) {
      infoContent.textContent = WH.utils.t('defaultInfoText');
      return;
    }

    const getRenderer = RENDERERS[userData.type];
    if (!getRenderer) return;

    infoContent.innerHTML = getRenderer()(userData);
  }

  function init() {
    WH.events.on('scene:selectionChange', render);
  }

  return { init, render };
})();