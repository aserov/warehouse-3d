window.WH = window.WH || {};
WH.webgl = WH.webgl || {};

WH.webgl.SelectionManager = class {
  constructor(onChange) {
    this.selectedObject = null;
    this.originalMaterial = null;
    this.originalScale = null;
    this.onChange = onChange;
  }

  restoreVisual() {
    if (this.selectedObject) {
      const mesh = this.selectedObject;
      if (this.originalMaterial) mesh.material = this.originalMaterial;
      if (this.originalScale) mesh.scale.copy(this.originalScale);
    }
    this.selectedObject = null;
    this.originalMaterial = null;
    this.originalScale = null;
  }

  clear() {
    this.restoreVisual();
    this.onChange(null);
  }

  select(object) {
    if (!object) {
      this.clear();
      return;
    }

    if (this.selectedObject === object) return;

    this.restoreVisual();

    const userData = object.userData;
    if (!userData?.type) {
      this.onChange(null);
      return;
    }

    const mesh = object;
    this.selectedObject = object;
    this.originalMaterial = mesh.material;
    this.originalScale = mesh.scale.clone();

    const { selection } = WH.config.WAREHOUSE_CONFIG.colors;

    if (userData.type === 'cell') {
      mesh.material = new THREE.MeshStandardMaterial({
        color: selection,
        roughness: 0.2,
        metalness: 0.5,
        emissive: 0x333300,
      });
    } else if (userData.type === 'area' || userData.type === 'row' || userData.type === 'floor') {
      mesh.scale.multiplyScalar(1.3);
    } else if (userData.type === 'level') {
      mesh.scale.multiplyScalar(1.3);
    }

    this.onChange(userData);
  }

  static resolveSelectable(object) {
    let current = object;
    while (current && !current.userData?.type && current.parent) {
      current = current.parent;
    }
    return current && current.userData?.type ? current : null;
  }
};