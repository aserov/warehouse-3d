window.Warehouse = window.Warehouse || {};

window.Warehouse.SceneSetup = (function() {
  const { CONFIG } = window.Warehouse;
  const { colors } = CONFIG;

  const container = document.getElementById('canvas-container');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(colors.bg);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.75);
  dirLight.position.set(100, 150, 100);
  scene.add(dirLight);

  // Floor & Grid
  const floorSize = 400;
  const gridHelper = new THREE.GridHelper(floorSize, 80, colors.gridMain, colors.gridSection);
  gridHelper.position.set(floorSize / 2, 0, floorSize / 2);
  scene.add(gridHelper);

  const warehouseGroup = new THREE.Group();
  scene.add(warehouseGroup);

  return { scene, camera, renderer, controls, raycaster, mouse, warehouseGroup };
})();