window.Warehouse = window.Warehouse || {};

window.Warehouse.CameraController = (function() {
  const { CONFIG, SceneSetup } = window.Warehouse;
  const { camera, controls, warehouseGroup } = SceneSetup;

  let is2DView = false;
  const saved3DCameraPos = new THREE.Vector3();
  const saved3DTarget = new THREE.Vector3();

  // Range bounds for zoom scaling
  let minCamDist = 50;
  let maxCamDist = 1200;

  function fitCameraToWarehouse() {
    const boundingBox = new THREE.Box3().setFromObject(warehouseGroup);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    boundingBox.getCenter(center);
    boundingBox.getSize(size);

    controls.target.copy(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    const cameraDistance = maxDim * 1.2;

    minCamDist = maxDim * 0.2;
    maxCamDist = maxDim * 3.5;

    camera.position.set(
      center.x + cameraDistance * 0.4,
      center.y + cameraDistance * 0.7,
      center.z + cameraDistance * 0.8
    );
    camera.lookAt(center);
    controls.update();
  }

  function animateCameraTo(targetPos, targetLookAt, duration = 800) {
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

  function set2DView() {
    if (is2DView) return;
    is2DView = true;

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
  }

  function set3DView() {
    if (!is2DView) return;
    is2DView = false;

    animateCameraTo(saved3DCameraPos, saved3DTarget);
    controls.enableRotate = true;
  }

  function resetView() {
    if (is2DView) {
      is2DView = false;
      controls.enableRotate = true;

      const btn2D = document.getElementById('btn-view-2d');
      const btn3D = document.getElementById('btn-view-3d');
      if (btn2D) btn2D.classList.remove('active');
      if (btn3D) btn3D.classList.add('active');
    }
    fitCameraToWarehouse();
  }

  function toggle2DView() {
    if (is2DView) {
      set3DView();
    } else {
      set2DView();
    }
  }

  /* --- Compass & Directional Rotation Logic --- */
  function updateCompass() {
    const compassArrow = document.getElementById('compass-arrow');
    const zoomSlider = document.getElementById('zoom-slider');

    if (compassArrow) {
      const dir = camera.position.clone().sub(controls.target);
      const angleRad = Math.atan2(dir.x, dir.z);
      const angleDeg = angleRad * (180 / Math.PI);
      compassArrow.style.transform = `rotate(${-angleDeg}deg)`;
    }

    if (zoomSlider && document.activeElement !== zoomSlider) {
      const dist = camera.position.distanceTo(controls.target);
      const normalized = 100 - Math.min(Math.max(((dist - minCamDist) / (maxCamDist - minCamDist)) * 100, 0), 100);
      zoomSlider.value = normalized;
    }
  }

  function rotateToCardinal(angleDegrees) {
    if (is2DView) return;

    const rad = (angleDegrees * Math.PI) / 180;
    const target = controls.target.clone();
    const currentDist = camera.position.distanceTo(target);
    const polarAngle = controls.getPolarAngle();

    const sinPolar = Math.sin(polarAngle);
    const cosPolar = Math.cos(polarAngle);

    const newX = target.x + currentDist * sinPolar * Math.sin(rad);
    const newZ = target.z + currentDist * sinPolar * Math.cos(rad);
    const newY = target.y + currentDist * cosPolar;

    animateCameraTo(new THREE.Vector3(newX, newY, newZ), target);
  }

  /* --- Interactive Zoom Functions --- */
  function zoomByFactor(factor) {
    const target = controls.target;
    const offset = camera.position.clone().sub(target);
    offset.multiplyScalar(factor);

    const newDist = offset.length();
    if (newDist >= minCamDist && newDist <= maxCamDist) {
      camera.position.copy(target).add(offset);
      controls.update();
    }
  }

  function setZoomFromSlider(percentValue) {
    const target = controls.target;
    const currentDir = camera.position.clone().sub(target).normalize();
    const targetDist = maxCamDist - ((percentValue / 100) * (maxCamDist - minCamDist));

    camera.position.copy(target).add(currentDir.multiplyScalar(targetDist));
    controls.update();
  }

  return {
    fitCameraToWarehouse,
    toggle2DView,
    set2DView,
    set3DView,
    resetView,
    updateCompass,
    rotateToCardinal,
    zoomIn: () => zoomByFactor(0.85),
    zoomOut: () => zoomByFactor(1.18),
    setZoomFromSlider
  };
})();