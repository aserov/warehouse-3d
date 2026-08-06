window.Warehouse = window.Warehouse || {};

(function() {
  const { CONFIG, SceneSetup, Builder, CameraController, UIController, Utils } = window.Warehouse;
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

      const infoContent = document.getElementById('info-content');
      if (infoContent) {
        infoContent.textContent = Warehouse.Utils.t("defaultInfoText");
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
    if (window.Warehouse.ToolbarClock && window.Warehouse.ToolbarClock.start) {
      window.Warehouse.ToolbarClock.start();
    }
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

  // --- Multi-warehouse state ---
  let rawData = null;           // { warehouses: [...] } as fetched from server
  let currentWarehouse = null;  // currently active warehouse object
  let currentWarehouseId = null;

  /**
   * A warehouse polygon is only considered valid if it's an array of at least 3 points.
   */
  function isValidPolygon(polygon) {
    return Array.isArray(polygon) && polygon.length >= 3;
  }

  /**
   * Renders the warehouse scene for a specific floor of the currently active warehouse.
   * @param {number|string} floorNumber - The floor number to filter and render.
   */
  function renderWarehouseForFloor(floorNumber) {
    if (!currentWarehouse) return;

    // Clear active selection before re-building 3D mesh objects
    Selection.clear();

    // Filter areas that belong to the selected floor (within the active warehouse only)
    const filteredAreas = (currentWarehouse.areas || []).filter(
      area => Number(area.floor) === Number(floorNumber)
    );

    const filteredData = {
      ...currentWarehouse,
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

  /**
   * Selects a warehouse: validates its polygon, applies its geometry (polygon + scale)
   * onto CONFIG, resolves its floor list, and triggers a fresh render on the minimal floor.
   * @param {number|string} warehouseId
   */
  function selectWarehouse(warehouseId) {
    if (!rawData || !Array.isArray(rawData.warehouses)) return;

    const warehouse = rawData.warehouses.find(w => Number(w.warehouse) === Number(warehouseId));
    if (!warehouse) return;

    currentWarehouse = warehouse;
    currentWarehouseId = warehouse.warehouse;

    // Keep the warehouse dropdown in sync even on programmatic selection
    UIController.populateWarehouses(rawData.warehouses, currentWarehouseId, (newId) => selectWarehouse(newId));

    if (!isValidPolygon(warehouse.polygon)) {
      const details = `Polygon is not defined for warehouse "${warehouse.warehouseName}" [id=${warehouse.warehouse}]`;

      console.error(`[Warehouse] ${details}`);
      UIController.showErrorUI('Warehouse configuration error', details);

      Selection.clear();
      CONFIG.buildingPolygon = null; // don't leave a stale outline from a previously valid warehouse
      Builder.buildWarehouse({ areas: [] }); // clears the scene without drawing an outline
      UIController.populateFloors([], null, () => {});
      UIController.populateAreas([], 'all', () => {});
      return;
    }

    // Apply this warehouse's geometry onto CONFIG - everything downstream
    // (Builder, LayoutEngine, CameraController) reads these live.
    CONFIG.buildingPolygon = warehouse.polygon;
    CONFIG.scaleFactor = (typeof warehouse.scale === 'number' && warehouse.scale > 0)
      ? warehouse.scale
      : CONFIG.scaleFactor; // fallback to whatever CONFIG already had

    const uniqueFloors = [...new Set((warehouse.areas || []).map(a => Number(a.floor)).filter(Boolean))].sort((a, b) => a - b);

    if (uniqueFloors.length === 0) {
      const details = `No floor data found for warehouse "${warehouse.warehouseName}" [id=${warehouse.warehouse}]`;
      console.error(`[Warehouse] ${details}`);
      UIController.showErrorUI('Warehouse data error', details);

      // The building polygon IS valid here, so we still draw the empty building shell -
      // only the floor/area listings are empty.
      Selection.clear();
      Builder.buildWarehouse({ areas: [] });
      UIController.populateFloors([], null, () => {});
      UIController.populateAreas([], 'all', () => {});
      return;
    }

    const initialFloor = uniqueFloors[0];

    UIController.populateFloors(uniqueFloors, initialFloor, (selectedFloor) => {
      renderWarehouseForFloor(selectedFloor);
    });

    renderWarehouseForFloor(initialFloor);
  }

  // Fetch Data & Dynamic Warehouse/Floor Initialization
  fetch('data/cells-min-new.json')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (!data || !data.warehouses || !Array.isArray(data.warehouses) || data.warehouses.length === 0) {
        throw new Error('Received empty or invalid JSON data structure.');
      }

      rawData = data;

      const initialWarehouse = data.warehouses[0];
      selectWarehouse(initialWarehouse.warehouse);
    })
    .catch(err => {
      console.error("Error loading cells-min.json:", err);
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
