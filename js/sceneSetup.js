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

  // --- Dynamic Floor Grid State ---
  let currentGridHelper = null;
  let currentGridBounds = { size: gridCfg?.size || 500, center: new THREE.Vector3(0, 0, 0) };

  /**
   * Dynamically recalculates grid dimensions and recreates the grid helper based on the warehouse polygon.
   * @param {Array<{x: number, z: number}>} polygon - Warehouse boundary points.
   * @param {number} scaleFactor - Polygon scaling factor.
   */
  function updateGridForPolygon(polygon, scaleFactor = 1) {
    if (!polygon || polygon.length === 0) return;

    // 1. Calculate bounding box of scaled polygon coordinates
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    polygon.forEach(pt => {
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

    // 2. Add ~20% outer padding and compute step size
    const maxDim = Math.max(width, depth);
    const rawSize = maxDim * 1.20;

    let step = 5;
    if (maxDim > 300) {
      step = 10;
    } else if (maxDim < 50) {
      step = 2;
    }

    const gridSize = Math.max(Math.ceil(rawSize / step) * step, step * 10);
    const divisions = Math.round(gridSize / step);

    // 3. Clean up existing GridHelper and its children (outer border loop)
    if (currentGridHelper) {
      scene.remove(currentGridHelper);

      currentGridHelper.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
          else child.material.dispose();
        }
      });
    }

    // 4. Create main GridHelper
    const uniformGridColor = colors.gridSection || 0xd0d7de;
    currentGridHelper = new THREE.GridHelper(
      gridSize,
      divisions,
      uniformGridColor,
      uniformGridColor
    );

    // 5. Create Outer Border (LineLoop)
    const halfSize = gridSize / 2;
    const borderPoints = [
      new THREE.Vector3(-halfSize, 0, -halfSize),
      new THREE.Vector3(halfSize, 0, -halfSize),
      new THREE.Vector3(halfSize, 0, halfSize),
      new THREE.Vector3(-halfSize, 0, halfSize)
    ];

    const borderGeometry = new THREE.BufferGeometry().setFromPoints(borderPoints);
    const borderMaterial = new THREE.LineBasicMaterial({
      color: colors.gridBorder || 0x8c9b9e,
      linewidth: 2
    });

    const gridBorder = new THREE.LineLoop(borderGeometry, borderMaterial);
    currentGridHelper.add(gridBorder);

    // 6. Position grid in scene
    const gridPositionY = gridCfg?.positionY ?? -0.05;
    currentGridHelper.position.set(centerX, gridPositionY, centerZ);
    scene.add(currentGridHelper);

    // 7. Save grid bounds for camera framing
    currentGridBounds = {
      size: gridSize,
      center: new THREE.Vector3(centerX, 0, centerZ)
    };
  }

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

    let cameraDistance = (maxDim / (2 * Math.tan(fovRad / 2))) * padding;
    cameraDistance = Math.max(cameraDistance, camCfg.minDistance);

    const offset = new THREE.Vector3(
      cameraDistance * 0.5,
      cameraDistance * 0.7,
      cameraDistance * 0.8
    );

    const calculatedCamPos = new THREE.Vector3().addVectors(center, offset);
    flyTo(calculatedCamPos, center);
  }

  /**
   * Adjusts the initial camera perspective to encompass the full grid bounds.
   */
  function fitCameraToGrid() {
    const center = currentGridBounds.center;
    const size = currentGridBounds.size;

    const fovRad = (camera.fov * Math.PI) / 180;
    const padding = 1.1;

    let cameraDistance = (size / (2 * Math.tan(fovRad / 2))) * padding;
    cameraDistance = Math.max(cameraDistance, camCfg.minDistance);

    const offset = new THREE.Vector3(
      cameraDistance * 0.55,
      cameraDistance * 0.75,
      cameraDistance * 0.85
    );

    const targetCamPos = new THREE.Vector3().addVectors(center, offset);
    flyTo(targetCamPos, center);
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
    focusOnBounds,
    updateGridForPolygon,
    fitCameraToGrid
  };
})();
