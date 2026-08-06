window.Warehouse = window.Warehouse || {};

window.Warehouse.SceneSetup = (function() {
  const { CONFIG } = window.Warehouse;
  const { colors, camera: camCfg, grid: gridCfg, focus: focusCfg } = CONFIG;

  const container = document.getElementById('canvas-container');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(colors.bg);

  const camera = new THREE.PerspectiveCamera(
    camCfg.fov,
    window.innerWidth / window.innerHeight,
    camCfg.near,
    camCfg.far
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  // --- OrbitControls Configuration ---
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = camCfg.maxPolarAngle;
  controls.minDistance = camCfg.minDistance;
  controls.maxDistance = camCfg.maxDistance;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // --- Lighting ---
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.75);
  dirLight.position.set(100, 150, 100);
  dirLight.castShadow = true;
  dirLight.shadow.bias = -0.0005;
  dirLight.shadow.normalBias = 0.05;
  scene.add(dirLight);

  // --- Floor Grid Setup ---
  const uniformGridColor = colors.gridSection || 0xd0d7de;
  const gridHelper = new THREE.GridHelper(
    gridCfg.size,
    gridCfg.divisions,
    uniformGridColor,
    uniformGridColor
  );

  gridHelper.position.set(gridCfg.centerX, gridCfg.positionY, gridCfg.centerZ);
  scene.add(gridHelper);

  const warehouseGroup = new THREE.Group();
  scene.add(warehouseGroup);

  // --- Camera Animation State ---
  let isAnimatingCamera = false;
  let animationStart = 0;
  let startCamPos = new THREE.Vector3();
  let targetCamPos = new THREE.Vector3();
  let startTargetPos = new THREE.Vector3();
  let targetLookAtPos = new THREE.Vector3();

  /**
   * Smoothly transitions the camera and OrbitControls target to new positions.
   * @param {THREE.Vector3} newCamPos - End position for camera.
   * @param {THREE.Vector3} newTarget - End position for controls target (lookAt).
   * @param {number} [duration] - Animation duration in ms.
   */
  function flyTo(newCamPos, newTarget, duration = focusCfg?.animationDuration || 1000) {
    startCamPos.copy(camera.position);
    startTargetPos.copy(controls.target);
    targetCamPos.copy(newCamPos);
    targetLookAtPos.copy(newTarget);

    animationStart = performance.now();
    isAnimatingCamera = true;

    function animateCamera(currentTime) {
      if (!isAnimatingCamera) return;

      const elapsed = currentTime - animationStart;
      const progress = Math.min(elapsed / duration, 1.0);

      // Smooth step easing (ease-in-out)
      const ease = progress * progress * (3 - 2 * progress);

      camera.position.lerpVectors(startCamPos, targetCamPos, ease);
      controls.target.lerpVectors(startTargetPos, targetLookAtPos, ease);
      controls.update();

      if (progress < 1.0) {
        requestAnimationFrame(animateCamera);
      } else {
        isAnimatingCamera = false;
      }
    }

    requestAnimationFrame(animateCamera);
  }

  /**
   * Calculates optimal camera distance and frames the given THREE.Box3 bounding box.
   * @param {THREE.Box3} box - Bounding box of the object to focus on.
   */
  function focusOnBounds(box) {
    if (!box || box.isEmpty()) return;

    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fovRad = (camera.fov * Math.PI) / 180;
    const padding = focusCfg?.paddingFactor || 1.4;

    // Calculate required camera distance based on FOV and bounding box size
    let cameraDistance = (maxDim / (2 * Math.tan(fovRad / 2))) * padding;
    cameraDistance = Math.max(cameraDistance, camCfg.minDistance);

    // Maintain an ergonomic isometric offset (~45 degrees elevation and tilt)
    const offset = new THREE.Vector3(
      cameraDistance * 0.5,
      cameraDistance * 0.7,
      cameraDistance * 0.8
    );

    const calculatedCamPos = new THREE.Vector3().addVectors(center, offset);
    flyTo(calculatedCamPos, center);
  }

  return {
    scene,
    camera,
    renderer,
    controls,
    raycaster,
    mouse,
    warehouseGroup,
    flyTo,
    focusOnBounds
  };
})();
