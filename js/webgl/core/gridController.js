window.WH = window.WH || {};
WH.webgl = WH.webgl || {};

WH.webgl.GridController = class {
  constructor(scene, camera, cameraAnimator, colors, gridCfg, camCfg) {
    this.scene = scene;
    this.camera = camera;
    this.cameraAnimator = cameraAnimator;
    this.colors = colors;
    this.gridCfg = gridCfg;
    this.camCfg = camCfg;

    this.currentGridHelper = null;
    this.currentGridBounds = { size: 500, center: new THREE.Vector3(0, 0, 0) };
    this.hasSetInitialCameraForGrid = false;
  }

  updateGridForPolygon(polygon, scaleFactor = 1) {
    if (!polygon || polygon.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

    polygon.forEach((pt) => {
      const x = pt.x * scaleFactor;
      const z = pt.z * scaleFactor;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    });

    const width = maxX - minX;
    const depth = maxZ - minZ;
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;

    const maxDim = Math.max(width, depth);
    const rawSize = maxDim * 1.2;

    let step = 5;
    if (maxDim > 300) step = 10;
    else if (maxDim < 50) step = 2;

    const gridSize = Math.max(Math.ceil(rawSize / step) * step, step * 10);
    const divisions = Math.round(gridSize / step);

    this.disposeCurrentGridHelper();

    const gridHelper = new THREE.GridHelper(gridSize, divisions, this.colors.gridSection, this.colors.gridSection);

    const halfSize = gridSize / 2;
    const borderPoints = [
      new THREE.Vector3(-halfSize, 0, -halfSize),
      new THREE.Vector3(halfSize, 0, -halfSize),
      new THREE.Vector3(halfSize, 0, halfSize),
      new THREE.Vector3(-halfSize, 0, halfSize),
    ];
    const borderGeometry = new THREE.BufferGeometry().setFromPoints(borderPoints);
    const borderMaterial = new THREE.LineBasicMaterial({ color: this.colors.gridBorder });
    const gridBorder = new THREE.LineLoop(borderGeometry, borderMaterial);
    gridHelper.add(gridBorder);

    gridHelper.position.set(centerX, this.gridCfg.positionY, centerZ);
    this.scene.add(gridHelper);

    this.currentGridHelper = gridHelper;
    this.currentGridBounds = { size: gridSize, center: new THREE.Vector3(centerX, 0, centerZ) };

    if (!this.hasSetInitialCameraForGrid) {
      this.hasSetInitialCameraForGrid = true;
      this.positionCameraForGridBounds(false);
    }
  }

  positionCameraForGridBounds(animate) {
    const { center, size } = this.currentGridBounds;
    const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
    const padding = this.gridCfg.paddingFactor;

    let cameraDistance = (size / (2 * Math.tan(fovRad / 2))) * padding;
    cameraDistance = Math.max(cameraDistance, this.camCfg.minDistance);

    const offset = new THREE.Vector3(cameraDistance * 0.55, cameraDistance * 0.75, cameraDistance * 0.85);
    const targetCamPos = new THREE.Vector3().addVectors(center, offset);

    if (animate) {
      this.cameraAnimator.animateCameraTo(targetCamPos, center);
    } else {
      this.cameraAnimator.snapTo(targetCamPos, center);
    }
  }

  fitCameraToGrid() {
    this.positionCameraForGridBounds(true);
  }

  disposeCurrentGridHelper() {
    if (!this.currentGridHelper) return;
    this.scene.remove(this.currentGridHelper);
    this.currentGridHelper.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((m) => m.dispose());
      }
    });
    this.currentGridHelper = null;
  }

  dispose() {
    this.disposeCurrentGridHelper();
  }
};