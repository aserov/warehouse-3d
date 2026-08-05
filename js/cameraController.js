window.Warehouse = window.Warehouse || {};

window.Warehouse.CameraController = (function() {
  const { CONFIG, SceneSetup } = window.Warehouse;
  const { camera, controls, warehouseGroup } = SceneSetup;

  let is2DView = false;
  const saved3DCameraPos = new THREE.Vector3();
  const saved3DTarget = new THREE.Vector3();

  function fitCameraToWarehouse() {
    const boundingBox = new THREE.Box3().setFromObject(warehouseGroup);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    boundingBox.getCenter(center);
    boundingBox.getSize(size);

    controls.target.copy(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    const cameraDistance = maxDim * 1.2;

    camera.position.set(
      center.x + cameraDistance * 0.4,
      center.y + cameraDistance * 0.7,
      center.z + cameraDistance * 0.8
    );
    camera.lookAt(center);
    controls.update();
  }

  function animateCameraTo(targetPos, targetLookAt, duration = 1000) {
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const startTime = performance.now();

    function updateCamera(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      camera.position.lerpVectors(startPos, targetPos, ease);
      controls.target.lerpVectors(startTarget, targetLookAt, ease);
      controls.update();

      if (progress < 1) requestAnimationFrame(updateCamera);
    }
    requestAnimationFrame(updateCamera);
  }

  function toggle2DView() {
    is2DView = !is2DView;
    const btn = document.getElementById('toggle2DBtn');

    if (is2DView) {
      saved3DCameraPos.copy(camera.position);
      saved3DTarget.copy(controls.target);

      let centerX = 210, centerZ = 260;
      if (CONFIG.buildingPolygon && CONFIG.buildingPolygon.length > 0) {
        const xs = CONFIG.buildingPolygon.map(p => p.x);
        const zs = CONFIG.buildingPolygon.map(p => p.z);
        centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
        centerZ = (Math.min(...zs) + Math.max(...zs)) / 2;
      }

      animateCameraTo(new THREE.Vector3(centerX, 600, centerZ + 0.1), new THREE.Vector3(centerX, 0, centerZ));
      controls.enableRotate = false;
      if (btn) btn.classList.add('active');
    } else {
      animateCameraTo(saved3DCameraPos, saved3DTarget);
      controls.enableRotate = true;
      if (btn) btn.classList.remove('active');
    }
  }

  return { fitCameraToWarehouse, toggle2DView };
})();