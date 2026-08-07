window.Warehouse = window.Warehouse || {};

window.Warehouse.Builder = (function() {
  const { CONFIG, Utils, SceneSetup, LayoutEngine } = window.Warehouse;
  const { scene, warehouseGroup } = SceneSetup;
  const { colors, focus: focusCfg } = CONFIG;

  const rowLabels = [];
  const levelLabels = [];
  const areaLabels = [];
  const interactiveObjects = [];

  /**
   * Generates canvas text sprite for coordinates and corner tags.
   */
  function createCornerLabel(text, color = 0x2c3e50) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.strokeStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.roundRect(8, 8, canvas.width - 16, canvas.height - 16, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(12, 6, 1);
    sprite.userData.initialOpacity = 1.0;
    return sprite;
  }

  /**
   * Completely clears existing warehouse objects, labels, and disposes GPU resources.
   */
  function clearWarehouse() {
    rowLabels.length = 0;
    levelLabels.length = 0;
    areaLabels.length = 0;
    interactiveObjects.length = 0;

    document.querySelectorAll('.area-label-element, .row-label-element').forEach(el => el.remove());

    const disposeObject = (obj) => {
      if (!obj) return;
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => {
            if (mat.map) mat.map.dispose();
            mat.dispose();
          });
        } else {
          if (obj.material.map) obj.material.map.dispose();
          obj.material.dispose();
        }
      }
    };

    if (warehouseGroup) {
      while (warehouseGroup.children.length > 0) {
        const child = warehouseGroup.children[0];
        warehouseGroup.remove(child);
        child.traverse(disposeObject);
      }
    }

    if (scene) {
      const objectsToRemove = [];
      scene.children.forEach(child => {
        if (child.userData && child.userData.isWarehouseObject) {
          objectsToRemove.push(child);
        }
      });

      objectsToRemove.forEach(obj => {
        scene.remove(obj);
        obj.traverse(disposeObject);
      });
    }
  }

  /**
   * Builds building floor perimeter and boundary lines.
   */
  function createBuildingOutline(polygonPoints) {
    if (!polygonPoints || polygonPoints.length < 3) return;

    const shape = new THREE.Shape();
    shape.moveTo(polygonPoints[0].x, polygonPoints[0].z);
    for (let i = 1; i < polygonPoints.length; i++) {
      shape.lineTo(polygonPoints[i].x, polygonPoints[i].z);
    }
    shape.closePath();

    const floorGeo = new THREE.ShapeGeometry(shape);
    const floorMat = new THREE.MeshStandardMaterial({
      color: colors.buildingFloor,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = Math.PI / 2;
    floorMesh.position.y = -0.01;
    floorMesh.userData.isWarehouseObject = true;
    warehouseGroup.add(floorMesh);

    const points3D = polygonPoints.map(p => new THREE.Vector3(p.x, 0.2, p.z));
    points3D.push(new THREE.Vector3(polygonPoints[0].x, 0.2, polygonPoints[0].z));

    const lineGeo = new THREE.BufferGeometry().setFromPoints(points3D);
    const lineMat = new THREE.LineBasicMaterial({ color: colors.buildingWall, linewidth: 4 });
    const outlineLine = new THREE.Line(lineGeo, lineMat);
    outlineLine.userData.isWarehouseObject = true;
    warehouseGroup.add(outlineLine);

    polygonPoints.forEach(point => {
      const labelText = `(${point.x}, ${point.z})`;
      const labelSprite = createCornerLabel(labelText, colors.buildingWall);
      labelSprite.position.set(point.x, 2.0, point.z);
      labelSprite.userData.isWarehouseObject = true;
      warehouseGroup.add(labelSprite);
    });
  }

  /**
   * Builds a shape (fill + border + per-vertex corner labels) directly from a polygon,
   * at the given y-heights. Shared by areas and rows so both can be non-rectangular
   * and rendered straight from server-provided polygons.
   * @param {THREE.Group} targetGroup
   * @param {Array<{x:number,z:number}>} polygonPoints
   * @param {number} color - hex color used for fill, border and corner labels
   * @param {{fillY:number, lineY:number, fillOpacity:number, lineWidth:number}} [opts]
   */
  function drawPolygonShape(targetGroup, polygonPoints, color, opts = {}) {
    const {
      fillY = 0.05,
      lineY = 0.08,
      fillOpacity = 0.07,
      lineWidth = 3
    } = opts;

    const shape = new THREE.Shape();
    shape.moveTo(polygonPoints[0].x, polygonPoints[0].z);
    for (let i = 1; i < polygonPoints.length; i++) {
      shape.lineTo(polygonPoints[i].x, polygonPoints[i].z);
    }
    shape.closePath();

    const fillGeo = new THREE.ShapeGeometry(shape);
    const fillMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: fillOpacity,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const fillMesh = new THREE.Mesh(fillGeo, fillMat);
    fillMesh.rotation.x = Math.PI / 2;
    fillMesh.position.y = fillY;
    fillMesh.userData.initialOpacity = fillOpacity;
    targetGroup.add(fillMesh);

    const points3D = polygonPoints.map(p => new THREE.Vector3(p.x, lineY, p.z));
    points3D.push(new THREE.Vector3(polygonPoints[0].x, lineY, polygonPoints[0].z));

    const lineGeo = new THREE.BufferGeometry().setFromPoints(points3D);
    const lineMat = new THREE.LineBasicMaterial({ color, linewidth: lineWidth, transparent: true, opacity: 1.0 });
    const borderLine = new THREE.Line(lineGeo, lineMat);
    borderLine.userData.initialOpacity = 1.0;
    targetGroup.add(borderLine);

    polygonPoints.forEach(point => {
      const cornerLabel = createCornerLabel(`(${Math.round(point.x)}, ${Math.round(point.z)})`, color);
      cornerLabel.position.set(point.x, lineY + 0.92, point.z);
      targetGroup.add(cornerLabel);
    });
  }

  /**
   * Builds an area's visual shape (fill + border) directly from its own polygon,
   * mirroring createBuildingOutline's approach so areas can be non-rectangular too.
   * Adds the resulting meshes into the given areaGroup (not warehouseGroup directly,
   * since areas are grouped per-area for focus/dim/selection purposes).
   * @param {THREE.Group} areaGroup
   * @param {Array<{x:number,z:number}>} polygonPoints
   * @param {number} areaColor - hex color used for both fill and border
   */
  function createAreaShape(areaGroup, polygonPoints, areaColor) {
    drawPolygonShape(areaGroup, polygonPoints, areaColor, {
      fillY: 0.05,
      lineY: 0.08,
      fillOpacity: 0.07,
      lineWidth: 3
    });
  }

  /**
   * Builds a row's visual outline (fill + border + corner labels) directly from its own
   * polygon, same approach as createAreaShape but drawn slightly above the area shape so
   * row borders stay visible on top of it. Drawn as-is, even if the row polygon extends
   * beyond its area or the building outline - misconfiguration should be visible.
   * @param {THREE.Group} rowGroup
   * @param {Array<{x:number,z:number}>} polygonPoints
   * @param {number} rowColor
   */
  function createRowShape(rowGroup, polygonPoints, rowColor) {
    drawPolygonShape(rowGroup, polygonPoints, rowColor, {
      fillY: 0.06,
      lineY: 0.09,
      fillOpacity: 0.12,
      lineWidth: 2
    });
  }

  /**
   * Main builder method rendering floor areas, racks, and labels.
   * @param {Object} data - Filtered floor warehouse data.
   */
  function buildWarehouse(data) {
    clearWarehouse();

    if (!data || !data.areas) return;

    const t = Utils.t.bind(Utils);
    const UI = window.Warehouse.UIController;

    createBuildingOutline(CONFIG.buildingPolygon);

    data.areas.forEach((areaData, areaIdx) => {
      // No polygon at all - just skip this area and its contents silently, let them configure it.
      if (!areaData.polygon) {
        console.warn(`[Warehouse] Area "${areaData.areaName}" has no polygon, skipping.`);
        return;
      }

      // Polygon present but malformed (< 3 points) - this is a real config error, surface it.
      if (!LayoutEngine.isValidPolygon(areaData.polygon)) {
        const details = `Area "${areaData.areaName}" [area=${areaData.area}] has an invalid polygon (needs at least 3 points).`;
        console.error(`[Warehouse] ${details}`);
        if (UI && UI.showErrorUI) UI.showErrorUI('Area configuration error', details);
        return;
      }

      const bounds = LayoutEngine.getPolygonBounds(areaData.polygon);

      const areaGroup = new THREE.Group();
      areaGroup.name = `Area_${areaData.areaName}`;

      const areaCells = [];
      areaData.rows.forEach(r => r.levels.forEach(l => areaCells.push(...l.cells)));
      const areaMetrics = Utils.calculateMetrics(areaCells);
      const areaSummary = { type: 'area', areaName: areaData.areaName, totalRows: areaData.rows.length, ...areaMetrics };
      areaGroup.userData = areaSummary;

      const areaColor = Utils.getAreaColor(areaIdx, areaData);

      areaData.rows.forEach((rowData) => {
        // No polygon at all - skip this row silently, let them configure it (same as areas).
        if (!rowData.polygon) {
          console.warn(`[Warehouse] Row "${rowData.rowName}" in area "${areaData.areaName}" has no polygon, skipping.`);
          return;
        }

        // Polygon present but malformed (< 3 points) - real config error, surface it.
        if (!LayoutEngine.isValidPolygon(rowData.polygon)) {
          const details = `Row "${rowData.rowName}" [row=${rowData.row}] in area "${areaData.areaName}" has an invalid polygon (needs at least 3 points).`;
          console.error(`[Warehouse] ${details}`);
          if (UI && UI.showErrorUI) UI.showErrorUI('Row configuration error', details);
          return;
        }

        const rowGroup = new THREE.Group();
        rowGroup.name = `Row_${rowData.rowName}`;

        const rowBounds = LayoutEngine.getPolygonBounds(rowData.polygon);

        // Row direction controls both the layout axis and the starting corner cells are
        // placed from. LTR/RTL lay cells out horizontally (along X); TTB/BTT lay cells out
        // vertically (along Z), in which case width/depth are swapped for positioning
        // purposes (the cell's depth becomes its size along the layout axis).
        const validDirections = ['LTR', 'RTL', 'TTB', 'BTT'];
        let direction = rowData.direction;
        if (!validDirections.includes(direction)) {
          console.warn(`[Warehouse] Row "${rowData.rowName}" has missing/invalid direction "${rowData.direction}", defaulting to LTR.`);
          direction = 'LTR';
        }
        const isVertical = direction === 'TTB' || direction === 'BTT';
        const orientation = isVertical ? 'vertical' : 'horizontal';

        const rowCells = [];
        rowData.levels.forEach(l => rowCells.push(...l.cells));
        const rowMetrics = Utils.calculateMetrics(rowCells);
        const rowSummary = {
          type: 'row',
          rowName: rowData.rowName,
          areaName: areaData.areaName,
          totalLevels: rowData.levels.length,
          direction,
          orientation,
          ...rowMetrics
        };
        rowGroup.userData = rowSummary;

        let currentYOffset = 0;

        rowData.levels.forEach((levelData) => {
          const levelGroup = new THREE.Group();
          levelGroup.name = `Level_${levelData.levelName}`;

          // Level summary/userData - not clickable yet, but prepared for later so we don't
          // have to revisit this once level click/summary UI is wired up.
          const levelMetrics = Utils.calculateMetrics(levelData.cells);
          const levelSummary = {
            type: 'level',
            levelName: levelData.levelName,
            rowName: rowData.rowName,
            areaName: areaData.areaName,
            direction,
            orientation,
            ...levelMetrics
          };
          levelGroup.userData = levelSummary;

          let levelMaxHeight = 0;
          let firstCellPos = null;
          let lastCellPos = null;

          // Layout cells in `place` order regardless of the order they appear in the data.
          const sortedCells = [...levelData.cells].sort((a, b) => a.place - b.place);

          // Running distance from the row's starting corner along the layout axis.
          let cursor = 0;

          sortedCells.forEach((cellData, cellIdx) => {
            const cellScale = Utils.getScaleFactor(cellData.measurement);
            const w = cellData.width * cellScale;
            const h = cellData.height * cellScale;
            const d = cellData.depth * cellScale;
            levelMaxHeight = Math.max(levelMaxHeight, h);

            // Size along the layout axis vs. the cross axis - swapped for vertical rows.
            const axisSize = isVertical ? d : w;
            const crossSize = isVertical ? w : d;

            const offsetAlongAxis = cursor;
            cursor += axisSize + CONFIG.cellGap;

            let posX, posZ;
            if (!isVertical) {
              // Horizontal: axis = X, cross = Z anchored at the row's top edge (minZ).
              posX = direction === 'LTR'
                ? rowBounds.minX + offsetAlongAxis + axisSize / 2
                : rowBounds.maxX - offsetAlongAxis - axisSize / 2;
              posZ = rowBounds.minZ + crossSize / 2;
            } else {
              // Vertical: axis = Z, cross = X anchored at the row's left edge (minX).
              posZ = direction === 'TTB'
                ? rowBounds.minZ + offsetAlongAxis + axisSize / 2
                : rowBounds.maxZ - offsetAlongAxis - axisSize / 2;
              posX = rowBounds.minX + crossSize / 2;
            }

            if (cellIdx === 0) firstCellPos = { x: posX, z: posZ };
            lastCellPos = { x: posX, z: posZ };

            const baseOpacity = cellData.active ? 0.9 : 0.4;
            const geometry = new THREE.BoxGeometry(w, h, d);
            const material = new THREE.MeshStandardMaterial({
              color: cellData.active ? areaColor : colors.inactive,
              roughness: 0.3,
              metalness: 0.1,
              transparent: true,
              opacity: baseOpacity
            });

            const cellMesh = new THREE.Mesh(geometry, material);
            cellMesh.position.set(posX, currentYOffset + h / 2, posZ);
            cellMesh.userData = {
              type: 'cell',
              data: cellData,
              areaName: areaData.areaName,
              areaSummary,
              rowName: rowData.rowName,
              levelName: levelData.levelName,
              direction,
              orientation,
              initialOpacity: baseOpacity
            };

            levelGroup.add(cellMesh);
            interactiveObjects.push(cellMesh);
          });

          const levelText = `${levelData.level}`;
          const labelCenterY = currentYOffset + (levelMaxHeight / 2);

          // Pick the spatial extremes regardless of which end place=1 started from,
          // so labels always sit on the actual left/right (or top/bottom) edge.
          if (firstCellPos && lastCellPos) {
            if (!isVertical) {
              const leftPos = firstCellPos.x <= lastCellPos.x ? firstCellPos : lastCellPos;
              const rightPos = firstCellPos.x <= lastCellPos.x ? lastCellPos : firstCellPos;

              const leftLevelMesh = Utils.createSideLevelLabel(levelText, 6, 6);
              leftLevelMesh.rotation.y = -Math.PI / 2;
              leftLevelMesh.position.set(rowBounds.minX - 0.05, labelCenterY, leftPos.z);
              leftLevelMesh.userData.initialOpacity = 1.0;
              levelGroup.add(leftLevelMesh);
              levelLabels.push(leftLevelMesh);

              const rightLevelMesh = Utils.createSideLevelLabel(levelText, 6, 6);
              rightLevelMesh.rotation.y = Math.PI / 2;
              rightLevelMesh.position.set(rowBounds.maxX + 0.05, labelCenterY, rightPos.z);
              rightLevelMesh.userData.initialOpacity = 1.0;
              levelGroup.add(rightLevelMesh);
              levelLabels.push(rightLevelMesh);
            } else {
              // Vertical rows: labels go on the top/bottom edge instead of left/right, so
              // no side rotation is applied (the plane's default facing already reads
              // correctly when approached along Z).
              const topPos = firstCellPos.z <= lastCellPos.z ? firstCellPos : lastCellPos;
              const bottomPos = firstCellPos.z <= lastCellPos.z ? lastCellPos : firstCellPos;

              const topLevelMesh = Utils.createSideLevelLabel(levelText, 6, 6);
              topLevelMesh.position.set(topPos.x, labelCenterY, rowBounds.minZ - 0.05);
              topLevelMesh.userData.initialOpacity = 1.0;
              levelGroup.add(topLevelMesh);
              levelLabels.push(topLevelMesh);

              const bottomLevelMesh = Utils.createSideLevelLabel(levelText, 6, 6);
              bottomLevelMesh.position.set(bottomPos.x, labelCenterY, rowBounds.maxZ + 0.05);
              bottomLevelMesh.userData.initialOpacity = 1.0;
              levelGroup.add(bottomLevelMesh);
              levelLabels.push(bottomLevelMesh);
            }
          }

          rowGroup.add(levelGroup);
          currentYOffset += levelMaxHeight + CONFIG.cellGap;
        });

        // Draw the row's own shape (fill + border + per-vertex corner labels) from its
        // polygon, drawn as-is even if it extends beyond the area or building outline.
        createRowShape(rowGroup, rowData.polygon, areaColor);

        // Row title: placed to the right of the row polygon's bottom-right corner (maxX, maxZ).
        const floorRowLabel = Utils.createFloorLabelMesh(rowData.rowName, areaColor, 36, 12, 140);
        floorRowLabel.position.set(rowBounds.maxX + 18, 0.09, rowBounds.maxZ);
        floorRowLabel.userData = { ...rowSummary, initialOpacity: 1.0 };

        rowGroup.add(floorRowLabel);
        rowLabels.push(floorRowLabel);
        interactiveObjects.push(floorRowLabel);
        areaGroup.add(rowGroup);
      });

      // Draw the area's own shape (fill + border + per-vertex corner labels) from its polygon.
      // Drawn regardless of whether it fits inside the building outline - misconfiguration
      // should be visible, not silently clipped.
      createAreaShape(areaGroup, areaData.polygon, areaColor);

      const areaCenterX = (bounds.minX + bounds.maxX) / 2;

      const labelText = `${t('area').toUpperCase()} ${areaData.areaName}`;
      const areaTitleMesh = Utils.createFloorLabelMesh(labelText, areaColor, 64, 16, 150);
      areaTitleMesh.position.set(areaCenterX, 0.10, bounds.maxZ - CONFIG.areaPadding / 2);
      areaTitleMesh.userData = { ...areaSummary, initialOpacity: 1.0 };

      areaGroup.add(areaTitleMesh);
      areaLabels.push(areaTitleMesh);
      interactiveObjects.push(areaTitleMesh);
      warehouseGroup.add(areaGroup);
    });
  }

  /**
   * Sets focus to a specific warehouse area or resets focus back to all areas.
   * @param {string|null} areaName - Name of the area to focus (e.g., 'RF') or null/'all' to reset.
   */
  function setFocusedArea(areaName) {
    const isReset = !areaName || areaName === 'all';
    const targetGroupName = isReset ? null : `Area_${areaName}`;
    const dimmedFactor = focusCfg?.dimmedOpacity || 0.15;

    let targetGroup = null;

    warehouseGroup.children.forEach(group => {
      if (group.name && group.name.startsWith('Area_')) {
        const isTargetArea = !isReset && group.name === targetGroupName;
        if (isTargetArea) targetGroup = group;

        group.traverse(child => {
          if (child.material) {
            const initOpacity = child.userData?.initialOpacity ?? 1.0;
            child.material.transparent = true;
            child.material.opacity = isReset || isTargetArea ? initOpacity : initOpacity * dimmedFactor;
            child.material.needsUpdate = true;
          }
        });
      }
    });

    if (targetGroup && SceneSetup.focusOnBounds) {
      const box = new THREE.Box3().setFromObject(targetGroup);
      SceneSetup.focusOnBounds(box);
    }
  }

  return { buildWarehouse, setFocusedArea, rowLabels, levelLabels, areaLabels, interactiveObjects };
})();
