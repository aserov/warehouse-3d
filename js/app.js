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
        } else if (type === 'area' || type === 'row' || type === 'floor') {
          const highlightMat = mesh.material.clone();
          if (highlightMat.color) {
            highlightMat.color.setHex(colors.selection || 0xfadb14);
          }
          if (highlightMat.emissive) {
            highlightMat.emissive.setHex(0x444400);
          }
          //mesh.material = highlightMat;
          mesh.scale.multiplyScalar(1.3);
        }
        else if (type === 'level') {
         mesh.scale.multiplyScalar(1.3);
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
  let pointerDownPos = { x: 0, y: 0 };

  function onPointerDown(event) {
    // Record initial coordinates on press to differentiate between a click and camera drag
    pointerDownPos = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event) {
    // Ignore clicks on UI overlays
    if (
      event.target.closest('#sidebar') ||
      event.target.closest('#top-toolbar') ||
      event.target.closest('.canvas-controls-left') ||
      event.target.closest('.canvas-controls-right') ||
      event.target.closest('.search-dropdown-menu') ||
      event.target.closest('.floor-dropdown-menu') ||
      event.target.closest('.fps-hint')
    ) return;

    // Calculate distance moved during interaction
    const deltaX = Math.abs(event.clientX - pointerDownPos.x);
    const deltaY = Math.abs(event.clientY - pointerDownPos.y);

    // If mouse moved more than 5px, it was a camera rotation/pan drag — do not alter selection
    if (deltaX > 5 || deltaY > 5) return;

    const container = document.getElementById('canvas-container');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(warehouseGroup.children, true);

    if (intersects.length > 0) {
      let clickedMesh = intersects[0].object;

      while (clickedMesh && (!clickedMesh.userData || !clickedMesh.userData.type) && clickedMesh.parent) {
        clickedMesh = clickedMesh.parent;
      }

      // Only switch selection if an actual interactive element (cell, row, area, level) is clicked.
      // Clicks on floor or background are ignored to keep current selection active.
      if (
        clickedMesh &&
        clickedMesh.userData &&
        ['cell', 'row', 'area', 'level'].includes(clickedMesh.userData.type)
      ) {
        Selection.select(clickedMesh);
      }
    }
  }

  // Register both pointerdown and pointerup to track click drag status correctly
  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);

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
  let rawData = null;
  let currentWarehouse = null;
  let currentWarehouseId = null;

  function isValidPolygon(polygon) {
    return Array.isArray(polygon) && polygon.length >= 3;
  }

  /**
   * Renders the warehouse scene for a specific floor of the currently active warehouse.
   * @param {number|string} floorNumber - The floor number to filter and render.
   */
  function renderWarehouseForFloor(floorNumber) {
    if (!currentWarehouse) return;

    Selection.clear();

    const filteredAreas = (currentWarehouse.areas || []).filter(
      area => Number(area.floor) === Number(floorNumber)
    );

    const filteredData = {
      ...currentWarehouse,
      areas: filteredAreas
    };

    Builder.buildWarehouse(filteredData);

    // Initial camera framing centered on current grid boundaries
    if (SceneSetup.fitCameraToGrid) {
      SceneSetup.fitCameraToGrid();
    } else if (CameraController && CameraController.fitCameraToWarehouse) {
      CameraController.fitCameraToWarehouse();
    }

    updateCanvasSize();

    UIController.populateAreas(filteredAreas, 'all', (selectedArea) => {
      Selection.clear();
      if (selectedArea === 'all') {
        if (Builder.setFocusedArea) {
          Builder.setFocusedArea(null);
        } else if (SceneSetup.fitCameraToGrid) {
          SceneSetup.fitCameraToGrid();
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
   * Selects a warehouse: evaluates unit scaling factor, recalculates grid,
   * resolves floor options, and triggers scene rendering.
   * @param {number|string} warehouseId
   */
  function selectWarehouse(warehouseId) {
    if (!rawData || !Array.isArray(rawData.warehouses)) return;

    const warehouse = rawData.warehouses.find(w => Number(w.warehouse) === Number(warehouseId));
    if (!warehouse) return;

    currentWarehouse = warehouse;
    currentWarehouseId = warehouse.warehouse;

    UIController.populateWarehouses(rawData.warehouses, currentWarehouseId, (newId) => selectWarehouse(newId));

    if (!isValidPolygon(warehouse.polygon)) {
      const details = `Polygon is not defined for warehouse "${warehouse.warehouseName}" [id=${warehouse.warehouse}]`;

      console.error(`[Warehouse] ${details}`);
      UIController.showErrorUI('Warehouse configuration error', details);

      Selection.clear();
      CONFIG.buildingPolygon = null;
      Builder.buildWarehouse({ areas: [] });
      UIController.populateFloors([], null, () => {});
      UIController.populateAreas([], 'all', () => {});
      return;
    }

    CONFIG.buildingPolygon = warehouse.polygon;

    // Determine target scaling factor using measurement unit or explicit scale
    const warehouseScale = Utils.getScaleFactor(warehouse.measurement);

    // Rebuild floor grid according to calculated polygon geometry and scale
    if (SceneSetup.updateGridForPolygon) {
      SceneSetup.updateGridForPolygon(warehouse.polygon, warehouseScale);
    }

    const uniqueFloors = [...new Set((warehouse.areas || []).map(a => Number(a.floor)).filter(Boolean))].sort((a, b) => a - b);

    if (uniqueFloors.length === 0) {
      const details = `No floor data found for warehouse "${warehouse.warehouseName}" [id=${warehouse.warehouse}]`;
      console.error(`[Warehouse] ${details}`);
      UIController.showErrorUI('Warehouse data error', details);

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

  fetch('data/cells-min.json')
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

  function animate() {
    requestAnimationFrame(animate);

    const fpsController = window.Warehouse?.FPSController;
    const isFPSActive = fpsController && fpsController.isFPS();

    if (isFPSActive) {
      // 1. In FPS mode: update ONLY WASD movement (OrbitControls MUST be paused)
      fpsController.update();
    } else {
      // 2. In Orbit mode (2D / 3D): update orbit controls and compass
      controls.update();

      if (window.Warehouse.CameraController?.updateCompass) {
        window.Warehouse.CameraController.updateCompass();
      }
    }

    renderer.render(scene, camera);
  }
  animate();
  window.Warehouse.SettingsManager.init();
})();
