window.WH = window.WH || {};
WH.webgl = WH.webgl || {};

(function() {
  function createEmptyLabelRegistry() {
    return { floorLabels: [], areaLabels: [], rowLabels: [], levelLabels: [], cornerLabels: [] };
  }

  function disposeObject3D(object) {
    const mesh = object;
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => {
        if (material.map) material.map.dispose();
        material.dispose();
      });
    }
  }

  function clearWarehouseGroup(group) {
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      child.traverse(disposeObject3D);
    }
  }

  function buildWarehouseScene(group, input) {
    clearWarehouseGroup(group);

    const registry = createEmptyLabelRegistry();
    WH.webgl.builders.buildFloorGroup(group, input, registry);

    return registry;
  }

  WH.webgl.clearWarehouseGroup = clearWarehouseGroup;
  WH.webgl.buildWarehouseScene = buildWarehouseScene;
})();