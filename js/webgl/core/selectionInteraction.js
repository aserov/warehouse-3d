window.WH = window.WH || {};
WH.webgl = WH.webgl || {};

WH.webgl.SelectionInteraction = class {
  static DRAG_THRESHOLD_PX = 5;

  constructor(container, camera, warehouseGroup, selectionManager, cameraAnimator, focusCfg, camCfg) {
    this.container = container;
    this.camera = camera;
    this.warehouseGroup = warehouseGroup;
    this.selectionManager = selectionManager;
    this.cameraAnimator = cameraAnimator;
    this.focusCfg = focusCfg;
    this.camCfg = camCfg;

    this.raycaster = new THREE.Raycaster();
    this.pointerNdc = new THREE.Vector2();
    this.pointerDownPos = null;

    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
  }

  attach(domElement) {
    domElement.addEventListener('pointerdown', this.handlePointerDown);
    domElement.addEventListener('pointerup', this.handlePointerUp);
  }

  detach(domElement) {
    domElement.removeEventListener('pointerdown', this.handlePointerDown);
    domElement.removeEventListener('pointerup', this.handlePointerUp);
  }

  handlePointerDown(event) {
    this.pointerDownPos = { x: event.clientX, y: event.clientY };
  }

  handlePointerUp(event) {
    const target = event.target;
    if (
      target.closest('.warehouse-view-mode-control') ||
      target.closest('.warehouse-fps-overlay') ||
      target.closest('.warehouse-page__sidebar')
    ) {
      return;
    }

    if (!this.pointerDownPos) return;

    const deltaX = Math.abs(event.clientX - this.pointerDownPos.x);
    const deltaY = Math.abs(event.clientY - this.pointerDownPos.y);
    this.pointerDownPos = null;

    if (deltaX > WH.webgl.SelectionInteraction.DRAG_THRESHOLD_PX ||
        deltaY > WH.webgl.SelectionInteraction.DRAG_THRESHOLD_PX) return;

    const rect = this.container.getBoundingClientRect();
    this.pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const intersects = this.raycaster.intersectObjects(this.warehouseGroup.children, true);

    if (intersects.length > 0) {
      const selectable = WH.webgl.SelectionManager.resolveSelectable(intersects[0].object);
      if (selectable) this.selectionManager.select(selectable);
    }
  }

  setFocusedArea(areaName) {
    const isReset = !areaName || areaName === 'all';
    const targetGroupName = isReset ? null : `Area_${areaName}`;
    const dimmedFactor = this.focusCfg.dimmedOpacity;

    let targetGroup = null;

    this.warehouseGroup.children.forEach((child) => {
      if (child.name && child.name.startsWith('Area_')) {
        const isTargetArea = !isReset && child.name === targetGroupName;
        if (isTargetArea) targetGroup = child;

        child.traverse((descendant) => {
          if (descendant.material) {
            const initOpacity = descendant.userData?.initialOpacity ?? 1.0;
            const materials = Array.isArray(descendant.material) ? descendant.material : [descendant.material];
            materials.forEach((material) => {
              material.transparent = true;
              material.opacity = isReset || isTargetArea ? initOpacity : initOpacity * dimmedFactor;
              material.needsUpdate = true;
            });
          }
        });
      }
    });

    if (targetGroup) {
      const box = new THREE.Box3().setFromObject(targetGroup);
      this.cameraAnimator.focusOnBounds(box, this.focusCfg.paddingFactor, this.camCfg.minDistance);
    }
  }

  focusAndSelectCell(cellNumber) {
    let found = null;

    this.warehouseGroup.traverse((object) => {
      if (found) return;
      const userData = object.userData;
      if (userData?.type === 'cell' && userData.data.number === cellNumber) found = object;
    });

    if (!found) return false;

    this.selectionManager.select(found);

    const box = new THREE.Box3().setFromObject(found);
    const paddedBox = box.clone().expandByScalar(25);
    this.cameraAnimator.focusOnBounds(paddedBox, this.focusCfg.paddingFactor, this.camCfg.minDistance);
    return true;
  }

  clearSelection() {
    this.selectionManager.clear();
  }
};