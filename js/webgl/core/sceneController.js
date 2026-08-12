window.WH = window.WH || {};
WH.webgl = WH.webgl || {};

WH.webgl.SceneController = (function() {
  let core = null;
  let cameraAnimator = null;
  let gridController = null;
  let viewModeController = null;
  let selectionInteraction = null;
  let selectionManager = null;
  let warehouseGroup = null;
  let labelRegistry = null;
  let renderFrameId = 0;
  let container = null;

  function getWarehouseCenter() {
    const box = new THREE.Box3().setFromObject(warehouseGroup);
    const center = new THREE.Vector3();
    if (!box.isEmpty()) box.getCenter(center);
    return center;
  }

  function init(containerEl) {
    container = containerEl;
    const { camera: camCfg, colors, grid: gridCfg, focus: focusCfg } = WH.config.WAREHOUSE_CONFIG;

    core = WH.webgl.createSceneCore(
      container,
      (azimuthDeg) => WH.events.emit('scene:azimuthChange', azimuthDeg),
      (zoomPercent) => WH.events.emit('scene:zoomChange', zoomPercent),
      (position, target) => WH.events.emit('scene:cameraChange', { position, target }),
    );

    WH.webgl.buildAxes(core.scene);

    cameraAnimator = new WH.webgl.CameraAnimator(core.camera, core.controls);
    gridController = new WH.webgl.GridController(core.scene, core.camera, cameraAnimator, colors, gridCfg, camCfg);

    warehouseGroup = new THREE.Group();
    core.scene.add(warehouseGroup);

    labelRegistry = { floorLabels: [], areaLabels: [], rowLabels: [], levelLabels: [], cornerLabels: [] };

    selectionManager = new WH.webgl.SelectionManager((selection) => {
      WH.events.emit('scene:selectionChange', selection);
    });

    viewModeController = new WH.webgl.ViewModeController(
      core.camera, core.controls, cameraAnimator, core.renderer.domElement,
      getWarehouseCenter,
      () => gridController.fitCameraToGrid(),
      (mode) => WH.events.emit('scene:viewModeChange', mode),
      camCfg.minDistance, camCfg.maxDistance,
    );

    selectionInteraction = new WH.webgl.SelectionInteraction(
      container, core.camera, warehouseGroup, selectionManager, cameraAnimator, focusCfg, camCfg,
    );
    selectionInteraction.attach(core.renderer.domElement);

    const animate = () => {
      renderFrameId = requestAnimationFrame(animate);
      viewModeController.update();
      core.renderer.render(core.scene, core.camera);
    };
    animate();

    core.notifyAzimuth();
  }

  function setWarehouseScene(input) {
    labelRegistry = WH.webgl.buildWarehouseScene(warehouseGroup, input);
  }

  function setLabelVisibility(key, visible) {
    labelRegistry[key].forEach((object) => { object.visible = visible; });
  }

  function dispose() {
    if (!core) return;

    selectionInteraction.detach(core.renderer.domElement);
    selectionManager.clear();
    viewModeController.dispose();
    cancelAnimationFrame(renderFrameId);
    cameraAnimator.cancel();
    gridController.dispose();
    core.dispose();

    core.scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((m) => m.dispose());
      }
    });

    if (core.renderer.domElement.parentElement === container) {
      container.removeChild(core.renderer.domElement);
    }

    core = null;
  }

  return {
    init,
    dispose,
    setZoom: (percent) => viewModeController.setZoom(percent),
    rotateToCompass: (direction) => viewModeController.rotateToCompass(direction),
    setViewMode: (mode) => viewModeController.setViewMode(mode),
    resetViewMode: () => viewModeController.resetViewMode(),
    updateGridForPolygon: (polygon, scaleFactor) => gridController.updateGridForPolygon(polygon, scaleFactor),
    fitCameraToGrid: () => gridController.fitCameraToGrid(),
    setWarehouseScene,
    setFocusedArea: (areaName) => selectionInteraction.setFocusedArea(areaName),
    focusAndSelectCell: (cellNumber) => selectionInteraction.focusAndSelectCell(cellNumber),
    setLabelVisibility,
    clearSelection: () => selectionInteraction.clearSelection(),
  };
})();