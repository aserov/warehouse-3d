(function() {
  const { CONFIG, SceneSetup, Builder, CameraController, UIController } = window.Warehouse;
  const { scene, camera, renderer, controls, raycaster, mouse, warehouseGroup } = SceneSetup;
  const { colors } = CONFIG;

  let selectedMesh = null;
  let originalMaterial = null;

  function onPointerDown(event) {
    // Prevent raycasting when clicking UI elements
    if (
      event.target.closest('#sidebar') ||
      event.target.closest('#top-toolbar') ||
      event.target.closest('.canvas-controls-left') ||
      event.target.closest('.canvas-controls-right')
    ) return;

    const container = document.getElementById('canvas-container');
    const rect = container.getBoundingClientRect();

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

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

  // Bind Compass Buttons & Zoom Controls
  function initNavigationControls() {
    document.querySelectorAll('.compass-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const angle = parseFloat(e.target.getAttribute('data-angle'));
        if (!isNaN(angle)) CameraController.rotateToCardinal(angle);
      });
    });

    document.getElementById('zoom-in-btn')?.addEventListener('click', CameraController.zoomIn);
    document.getElementById('zoom-out-btn')?.addEventListener('click', CameraController.zoomOut);

    document.getElementById('zoom-slider')?.addEventListener('input', (e) => {
      CameraController.setZoomFromSlider(parseFloat(e.target.value));
    });
  }

  UIController.initEvents();
  initNavigationControls();

  window.addEventListener('pointerdown', onPointerDown);

  document.addEventListener('DOMContentLoaded', () => {
    UIController.applyTranslations();
    UIController.startClock();
  });

  function updateCanvasSize() {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  window.addEventListener('resize', updateCanvasSize);

  let rawWarehouseData = null;

  /**
   * Renders the warehouse scene for a specific floor.
   * @param {number|string} floorNumber - The floor number to filter and render.
   */
  function renderWarehouseForFloor(floorNumber) {
    if (!rawWarehouseData) return;

    // Filter areas that belong to the selected floor
    const filteredAreas = (rawWarehouseData.areas || []).filter(
      area => Number(area.floor) === Number(floorNumber)
    );

    const filteredData = {
      ...rawWarehouseData,
      areas: filteredAreas
    };

    // Rebuild scene with filtered floor data
    Warehouse.Builder.buildWarehouse(filteredData);
    Warehouse.CameraController.fitCameraToWarehouse();
    if (typeof updateCanvasSize === 'function') {
      updateCanvasSize();
    }
  }

  // Fetch Data & Dynamic Floor Initialization
  fetch('data/cells-full.json')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (!data || !data.areas || !Array.isArray(data.areas) || data.areas.length === 0) {
        throw new Error('Received empty or invalid JSON data structure.');
      }

      rawWarehouseData = data;

      // Extract unique floor numbers from backend response and sort ascending
      const uniqueFloors = [...new Set(data.areas.map(a => Number(a.floor)).filter(Boolean))].sort((a, b) => a - b);

      if (uniqueFloors.length === 0) {
        throw new Error('No floor data found in JSON.');
      }

      // Select the first available floor by default
      const initialFloor = uniqueFloors[0];

      // Initialize floor dropdown selector UI
      Warehouse.UIController.populateFloors(uniqueFloors, initialFloor, (selectedFloor) => {
        renderWarehouseForFloor(selectedFloor);
      });

      // Initial render for default floor
      renderWarehouseForFloor(initialFloor);
    })
    .catch(err => {
      console.error("Error loading cells-full.json:", err);
      Warehouse.UIController.showErrorUI('Failed to load warehouse data', err.message);
    });

  // Render Loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    CameraController.updateCompass();
    renderer.render(scene, camera);
  }
  animate();
})();
