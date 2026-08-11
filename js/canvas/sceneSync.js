window.WH = window.WH || {};
WH.canvas = WH.canvas || {};

WH.canvas.SceneSync = (function() {
  let lastWarehouseId = null;
  let lastFloor = null;

  function buildSceneInput(state) {
    const wh = state.currentWarehouse;
    const areaLabelPrefix = WH.utils.t('area').toUpperCase();
    const floorLabelPrefix = WH.utils.t('floor');

    return {
      polygon: wh.polygon,
      warehouseName: wh.warehouseName,
      floor: state.selectedFloor,
      titleText: `${wh.warehouseName} (${floorLabelPrefix} ${state.selectedFloor})`,
      areas: state.areasForFloor.map((area) => ({
        areaName: area.areaName,
        polygon: area.polygon,
        labelText: `${areaLabelPrefix} ${area.areaName}`,
        rows: area.rows,
      })),
    };
  }

  function applyLabelVisibility() {
    const settings = WH.sidebar.SettingsStore.getAll();
    const controller = WH.webgl.SceneController;
    controller.setLabelVisibility('floorLabels', settings.floorLabels);
    controller.setLabelVisibility('areaLabels', settings.areaLabels);
    controller.setLabelVisibility('rowLabels', settings.rowLabels);
    controller.setLabelVisibility('levelLabels', settings.levelLabels);
    controller.setLabelVisibility('cornerLabels', settings.cornerLabels);
  }

  function applyFocusedArea(state) {
    if (state.selectedArea === WH.canvas.WarehouseDataStore.ALL_AREAS) {
      WH.webgl.SceneController.setFocusedArea(null);
      return;
    }

    const area = state.areasForFloor.find((a) => a.area === state.selectedArea);
    WH.webgl.SceneController.setFocusedArea(area ? area.areaName : null);
  }

  function handleDataChange(state) {
    if (state.loading || !state.currentWarehouse || state.selectedFloor === null) return;

    const warehouseChanged = state.selectedWarehouseId !== lastWarehouseId;
    const floorChanged = state.selectedFloor !== lastFloor;

    if (warehouseChanged) {
      const scaleFactor = WH.utils.getScaleFactor(state.currentWarehouse.measurement);
      WH.webgl.SceneController.updateGridForPolygon(state.currentWarehouse.polygon, scaleFactor);
      WH.webgl.SceneController.fitCameraToGrid();
    }

    if (warehouseChanged || floorChanged) {
      WH.webgl.SceneController.setWarehouseScene(buildSceneInput(state));
      applyLabelVisibility();

      lastWarehouseId = state.selectedWarehouseId;
      lastFloor = state.selectedFloor;
      return;
    }

    applyFocusedArea(state);
  }

  function init(container) {
    WH.webgl.SceneController.init(container);
    WH.events.on('warehouseData:change', handleDataChange);
    WH.events.on('settings:change', applyLabelVisibility);
  }

  return { init };
})();