window.Warehouse = window.Warehouse || {};

window.Warehouse.CameraController = (function() {
  const { CONFIG, SceneSetup, FPSController } = window.Warehouse;
  const { camera, controls, warehouseGroup, renderer } = SceneSetup;

  let is2DView = false;
  let isFPSView = false;
  const saved3DCameraPos = new THREE.Vector3();
  const saved3DTarget = new THREE.Vector3();

  // Range bounds for zoom scaling
  let minCamDist = 50;
  let maxCamDist = 1200;

  // Initialize FPS Controller callback if available
  if (FPSController) {
    FPSController.init(camera, renderer?.domElement || document.body, () => {
      onFPSExit();
    });
  }

  /* --- FPS Mode Integration --- */
  /* --- FPS Mode Integration --- */
  function enterFPSMode() {
    if (isFPSView) return;

    if (is2DView) {
      is2DView = false;
      controls.enableRotate = true;
    }

    // Save current 3D position and target to restore on exit
    saved3DCameraPos.copy(camera.position);
    saved3DTarget.copy(controls.target);

    isFPSView = true;
    controls.enabled = false; // Disable OrbitControls while in FPS mode

    // Calculate warehouse center (min + max) / 2
    let centerX = 210, centerZ = 260; // Default fallback

    if (CONFIG.buildingPolygon && CONFIG.buildingPolygon.length > 0) {
      const xs = CONFIG.buildingPolygon.map(p => p.x);
      const zs = CONFIG.buildingPolygon.map(p => p.z);
      centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
      centerZ = (Math.min(...zs) + Math.max(...zs)) / 2;
    } else if (warehouseGroup) {
      const boundingBox = new THREE.Box3().setFromObject(warehouseGroup);
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);
      centerX = center.x;
      centerZ = center.z;
    }

    // Pass calculated center coordinates to FPSController
    FPSController?.enter(centerX, centerZ);
  }

  function onFPSExit() {
    if (!isFPSView) return;

    isFPSView = false;

    // Position OrbitControls target 10 units in front of current camera view direction
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    controls.target.copy(camera.position).add(forward.multiplyScalar(10));

    if (controls.target.y < 0) {
      controls.target.y = 0;
    }

    controls.enabled = true;
    controls.update();

    if (window.setViewMode) {
      window.setViewMode('3D');
    }
  }

  /* --- Base Camera Controls --- */
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
    if (isFPSView) FPSController?.exit();
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
    if (isFPSView) FPSController?.exit();
    if (!is2DView) return;
    is2DView = false;

    animateCameraTo(saved3DCameraPos, saved3DTarget);
    controls.enableRotate = true;
  }

  function resetView() {
    if (isFPSView) FPSController?.exit();

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
    if (is2DView || isFPSView) return;

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
    if (isFPSView) return;

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
    if (isFPSView) return;

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
    enterFPSMode,
    resetView,
    updateCompass,
    rotateToCardinal,
    zoomIn: () => zoomByFactor(0.85),
    zoomOut: () => zoomByFactor(1.18),
    setZoomFromSlider
  };
})();
