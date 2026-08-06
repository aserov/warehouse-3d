window.Warehouse = window.Warehouse || {};

window.Warehouse.SceneSetup = (function() {
  const { CONFIG } = window.Warehouse;
  const { colors, camera: camCfg, grid: gridCfg } = CONFIG;

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

  return { scene, camera, renderer, controls, raycaster, mouse, warehouseGroup };
})();
