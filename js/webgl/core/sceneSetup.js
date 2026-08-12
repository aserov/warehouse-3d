window.WH = window.WH || {};
WH.webgl = WH.webgl || {};

WH.webgl.createSceneCore = function(container, onAzimuthChange, onZoomChange, onCameraChange) {
  const INITIAL_CAMERA_POSITION = new THREE.Vector3(40, 45, 50);
  const { camera: camCfg, colors } = WH.config.WAREHOUSE_CONFIG;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(colors.bg);

  const camera = new THREE.PerspectiveCamera(
    camCfg.fov, container.clientWidth / container.clientHeight, camCfg.near, camCfg.far,
  );
  camera.position.copy(INITIAL_CAMERA_POSITION);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.min(camCfg.maxPolarAngle, Math.PI / 2 - 0.02);
  controls.minDistance = camCfg.minDistance;
  controls.maxDistance = camCfg.maxDistance;

  const notifyAzimuth = () => {
    const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    onAzimuthChange(THREE.MathUtils.radToDeg(spherical.theta));
  };

  controls.addEventListener('change', () => {
    if (controls.target.y < 0) controls.target.y = 0;
    if (camera.position.y < 0.5) camera.position.y = 0.5;
    notifyAzimuth();

    if (onZoomChange) {
      const percent = WH.webgl.getZoomPercent(camera, controls, camCfg.minDistance, camCfg.maxDistance);
      onZoomChange(percent);
    }

    if (onCameraChange) {
      onCameraChange(camera.position.clone(), controls.target.clone());
    }
  });

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.75);
  dirLight.position.set(100, 150, 100);
  dirLight.castShadow = true;
  dirLight.shadow.bias = -0.0005;
  dirLight.shadow.normalBias = 0.05;
  scene.add(dirLight);

  const resizeObserver = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    if (width === 0 || height === 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });
  resizeObserver.observe(container);

  const dispose = () => {
    resizeObserver.disconnect();
    controls.dispose();
    renderer.dispose();
  };

  return { scene, camera, renderer, controls, notifyAzimuth, dispose };
};