window.WH = window.WH || {};
WH.webgl = WH.webgl || {};

WH.webgl.ViewModeController = class {
  static TOP_DOWN_HEIGHT = 600;

  constructor(camera, controls, cameraAnimator, domElement, getWarehouseCenter, fitCameraToGrid, onViewModeChange, minDistance, maxDistance) {
    this.camera = camera;
    this.controls = controls;
    this.cameraAnimator = cameraAnimator;
    this.getWarehouseCenter = getWarehouseCenter;
    this.fitCameraToGrid = fitCameraToGrid;
    this.onViewModeChange = onViewModeChange;
    this.minDistance = minDistance;
    this.maxDistance = maxDistance;

    this.is2DView = false;
    this.saved3DCameraPos = new THREE.Vector3();
    this.saved3DTarget = new THREE.Vector3();

    this.handleFpsExit = this.handleFpsExit.bind(this);
    this.fpsController = new WH.webgl.FpsController(camera, domElement, this.handleFpsExit);
  }

  handleFpsExit() {
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    this.controls.target.copy(this.camera.position).add(forward.multiplyScalar(10));
    if (this.controls.target.y < 0) this.controls.target.y = 0;

    this.controls.enabled = true;
    this.controls.update();
  }

  set2DView() {
    if (this.is2DView) return;
    this.is2DView = true;

    this.saved3DCameraPos.copy(this.camera.position);
    this.saved3DTarget.copy(this.controls.target);

    const center = this.getWarehouseCenter();
    this.cameraAnimator.animateCameraTo(
      new THREE.Vector3(center.x, WH.webgl.ViewModeController.TOP_DOWN_HEIGHT, center.z + 0.1),
      new THREE.Vector3(center.x, 0, center.z),
    );
    this.controls.enableRotate = false;
  }

  set3DView() {
    if (!this.is2DView) return;
    this.is2DView = false;

    this.cameraAnimator.animateCameraTo(this.saved3DCameraPos.clone(), this.saved3DTarget.clone());
    this.controls.enableRotate = true;
  }

  enterFPSMode() {
    this.saved3DCameraPos.copy(this.camera.position);
    this.saved3DTarget.copy(this.controls.target);

    if (this.is2DView) {
      this.is2DView = false;
      this.controls.enableRotate = true;
    }

    this.controls.enabled = false;

    const center = this.getWarehouseCenter();
    this.fpsController.enter(center.x, center.z);
  }

  setViewMode(mode) {
    if (mode === 'fps') {
      this.onViewModeChange('fps');
      this.enterFPSMode();
      return;
    }

    if (this.fpsController.isActive()) this.fpsController.exit();

    if (mode === '2d') {
      this.onViewModeChange('2d');
      this.set2DView();
    } else {
      this.onViewModeChange('3d');
      this.set3DView();
    }
  }

  resetViewMode() {
    if (this.fpsController.isActive()) this.fpsController.exit();

    if (this.is2DView) {
      this.is2DView = false;
      this.controls.enableRotate = true;
    }

    this.onViewModeChange('3d');
    this.fitCameraToGrid();
  }

  setZoom(percent) {
    if (this.fpsController.isActive()) return;
    WH.webgl.setZoom(this.camera, this.controls, percent, this.minDistance, this.maxDistance);
  }

  rotateToCompass(direction) {
    if (this.is2DView || this.fpsController.isActive()) return;
    WH.webgl.rotateToCompass(this.camera, this.controls, direction, (pos, target) =>
      this.cameraAnimator.animateCameraTo(pos, target),
    );
  }

  update() {
    if (this.fpsController.isActive()) {
      this.fpsController.update();
    } else {
      this.controls.update();
    }
  }

  isFpsActive() {
    return this.fpsController.isActive();
  }

  dispose() {
    this.fpsController.dispose();
  }
};