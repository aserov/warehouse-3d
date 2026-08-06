window.Warehouse = window.Warehouse || {};

(function() {
  const { CONFIG, SceneSetup, Builder, CameraController, UIController } = window.Warehouse;
  const { scene, camera, renderer, controls, raycaster, mouse, warehouseGroup } = SceneSetup;
  const { colors } = CONFIG;

// --- Unified Selection Manager ---
  const Selection = {
    selectedMesh: null,
    originalMaterial: null,
    originalScale: null,

    clear() {
      if (this.selectedMesh) {
        if (this.originalMaterial) {
          this.selectedMesh.material = this.originalMaterial;
        }
        if (this.originalScale) {
          this.selectedMesh.scale.copy(this.originalScale);
        }
      }
      this.selectedMesh = null;
      this.originalMaterial = null;
      this.originalScale = null;

      // Сброс информационной панели
      const infoContent = document.getElementById('info-content');
      if (infoContent) {
        const lang = (CONFIG && CONFIG.defaultLang) || 'en';
        const defaultText = (window.Warehouse.i18n && window.Warehouse.i18n[lang]?.defaultInfoText)
          || 'Click on a cell, row, or area to view details.';
        infoContent.textContent = defaultText;
      }
    },

    select(mesh) {
      if (!mesh) {
        this.clear();
        return;
      }

      if (this.selectedMesh === mesh) return;

      this.clear();

      if (mesh.userData && mesh.userData.type) {
        this.selectedMesh = mesh;
        this.originalMaterial = mesh.material;
        this.originalScale = mesh.scale.clone();

        const type = mesh.userData.type;

        if (type === 'cell') {
          mesh.material = new THREE.MeshStandardMaterial({
            color: colors.selection || 0xfadb14,
            roughness: 0.2,
            metalness: 0.5,
            emissive: 0x333300
          });
        } else if (type === 'area' || type === 'row') {
          const highlightMat = mesh.material.clone();
          if (highlightMat.color) {
            highlightMat.color.setHex(colors.selection || 0xfadb14);
          }
          if (highlightMat.emissive) {
            highlightMat.emissive.setHex(0x444400);
          }
          mesh.material = highlightMat;

          mesh.scale.multiplyScalar(1.15);
        }
      }

      if (mesh.userData && UIController && UIController.displayInfo) {
        UIController.displayInfo(mesh.userData);
      }
    }
  };

  // Export Selection manager to window.Warehouse
  window.Warehouse.Selection = Selection;

  // --- Pointer Interaction Handler ---
  function onPointerDown(event) {
    // Prevent raycasting when clicking UI controls or dropdown popups
    if (
      event.target.closest('#sidebar') ||
      event.target.closest('#top-toolbar') ||
      event.target.closest('.canvas-controls-left') ||
      event.target.closest('.canvas-controls-right') ||
      event.target.closest('.search-dropdown-menu') ||
      event.target.closest('.floor-dropdown-menu')
    ) return;

    const container = document.getElementById('canvas-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(warehouseGroup.children, true);

    if (intersects.length > 0) {
      let clickedMesh = intersects[0].object;

      // Travel up to parent node with userData if leaf geometry was hit
      while (clickedMesh && (!clickedMesh.userData || !clickedMesh.userData.type) && clickedMesh.parent) {
        clickedMesh = clickedMesh.parent;
      }

      Selection.select(clickedMesh);
    } else {
      // Clicked on empty space -> clear active highlight
      Selection.clear();
    }
  }

  // --- Navigation Controls Binding ---
  function initNavigationControls() {
    document.querySelectorAll('.compass-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const angle = parseFloat(e.target.getAttribute('data-angle'));
        if (!isNaN(angle) && CameraController && CameraController.rotateToCardinal) {
          CameraController.rotateToCardinal(angle);
        }
      });
    });

    document.getElementById('zoom-in-btn')?.addEventListener('click', () => CameraController?.zoomIn && CameraController.zoomIn());
    document.getElementById('zoom-out-btn')?.addEventListener('click', () => CameraController?.zoomOut && CameraController.zoomOut());

    document.getElementById('zoom-slider')?.addEventListener('input', (e) => {
      if (CameraController && CameraController.setZoomFromSlider) {
        CameraController.setZoomFromSlider(parseFloat(e.target.value));
      }
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

    // Clear active selection before re-building 3D mesh objects
    Selection.clear();

    // Filter areas that belong to the selected floor
    const filteredAreas = (rawWarehouseData.areas || []).filter(
      area => Number(area.floor) === Number(floorNumber)
    );

    const filteredData = {
      ...rawWarehouseData,
      areas: filteredAreas
    };

    // Rebuild 3D scene with filtered floor data
    Builder.buildWarehouse(filteredData);
    if (CameraController && CameraController.fitCameraToWarehouse) {
      CameraController.fitCameraToWarehouse();
    }
    updateCanvasSize();

    // Populate zone / area dropdown options for this specific floor
    UIController.populateAreas(filteredAreas, 'all', (selectedArea) => {
      Selection.clear();
      if (selectedArea === 'all') {
        if (Builder.setFocusedArea) {
          Builder.setFocusedArea(null);
        } else if (CameraController && CameraController.fitCameraToWarehouse) {
          CameraController.fitCameraToWarehouse();
        }
      } else {
        if (Builder.setFocusedArea) {
          Builder.setFocusedArea(selectedArea);
        }
      }
    });
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
      UIController.populateFloors(uniqueFloors, initialFloor, (selectedFloor) => {
        renderWarehouseForFloor(selectedFloor);
      });

      // Initial render for default floor
      renderWarehouseForFloor(initialFloor);
    })
    .catch(err => {
      console.error("Error loading cells-full.json:", err);
      UIController.showErrorUI('Failed to load warehouse data', err.message);
    });

  // Render Loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    if (CameraController && CameraController.updateCompass) {
      CameraController.updateCompass();
    }
    renderer.render(scene, camera);
  }
  animate();
})();
