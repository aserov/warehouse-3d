(function() {
  const { CONFIG, SceneSetup, Builder, CameraController, UIController } = window.Warehouse;
  const { scene, camera, renderer, controls, raycaster, mouse, warehouseGroup } = SceneSetup;
  const { colors } = CONFIG;

  let selectedMesh = null;
  let originalMaterial = null;

  function onPointerDown(event) {
    if (event.target.closest('#info-panel') || event.target.closest('#controls-panel')) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(warehouseGroup.children, true);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;

      if (selectedMesh && originalMaterial) {
        selectedMesh.material = originalMaterial;
        selectedMesh = null;
        originalMaterial = null;
      }

      if (clickedMesh.userData && clickedMesh.userData.type === 'cell') {
        selectedMesh = clickedMesh;
        originalMaterial = clickedMesh.material.clone();

        clickedMesh.material = new THREE.MeshStandardMaterial({
          color: colors.selection,
          roughness: 0.2,
          metalness: 0.5,
          emissive: 0x333300
        });
      }

      UIController.displayInfo(clickedMesh.userData);
    }
  }

  UIController.initEvents();
  document.getElementById('toggle2DBtn').addEventListener('click', CameraController.toggle2DView);
  window.addEventListener('pointerdown', onPointerDown);

  document.addEventListener('DOMContentLoaded', UIController.applyTranslations);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Fetch Data
  fetch('data/cells-full.json')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error('Received empty or invalid JSON data structure.');
      }
      Builder.buildWarehouse(data);
      CameraController.fitCameraToWarehouse();
    })
    .catch(err => {
      console.error("Error loading cells-full.json:", err);
      UIController.showErrorUI('Failed to load warehouse data', err.message);
    });

  // Render Loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
})();