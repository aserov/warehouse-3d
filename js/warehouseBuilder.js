window.Warehouse = window.Warehouse || {};

window.Warehouse.Builder = (function() {
  const { CONFIG, Utils, SceneSetup, LayoutEngine } = window.Warehouse;
  const { scene, warehouseGroup } = SceneSetup;
  const { colors } = CONFIG;

  const rowLabels = [];
  const levelLabels = [];
  const areaLabels = [];

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
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(12, 6, 1);
    return sprite;
  }

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
      roughness: 0.8,
      shininess: 10,  
      side: THREE.DoubleSide
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = Math.PI / 2;
    floorMesh.position.y = -0.01;
    scene.add(floorMesh);

    const points3D = polygonPoints.map(p => new THREE.Vector3(p.x, 0.2, p.z));
    points3D.push(new THREE.Vector3(polygonPoints[0].x, 0.2, polygonPoints[0].z));

    const lineGeo = new THREE.BufferGeometry().setFromPoints(points3D);
    const lineMat = new THREE.LineBasicMaterial({ color: colors.buildingWall, linewidth: 4 });
    scene.add(new THREE.Line(lineGeo, lineMat));

    polygonPoints.forEach(point => {
      const labelText = `(${point.x}, ${point.z})`;
      const labelSprite = createCornerLabel(labelText, colors.buildingWall);
      labelSprite.position.set(point.x, 2.0, point.z);
      scene.add(labelSprite);
    });
  }

  function buildWarehouse(data) {
    const t = Utils.t.bind(Utils);

    while (warehouseGroup.children.length > 0) {
      warehouseGroup.remove(warehouseGroup.children[0]);
    }
    rowLabels.length = 0;
    levelLabels.length = 0;
    areaLabels.length = 0;

    createBuildingOutline(CONFIG.buildingPolygon);

    let currentX = CONFIG.originX;
    let currentZ = CONFIG.originZ;
    let currentRowHeight = 0;

    data.areas.forEach((areaData, areaIdx) => {
      const dims = LayoutEngine.calculateAreaDimensions(areaData);
      const maxAllowedWallX = LayoutEngine.getMinWallWidthForZRange(CONFIG.buildingPolygon, currentZ, dims.totalDepth);
      const areaRightX = currentX + dims.totalWidth;
      const maxAvailableX = maxAllowedWallX - CONFIG.originX;

      if (areaRightX > maxAvailableX && currentX > CONFIG.originX) {
        currentX = CONFIG.originX;
        currentZ += currentRowHeight + CONFIG.areaGap;
        currentRowHeight = 0;
      }

      currentRowHeight = Math.max(currentRowHeight, dims.totalDepth);
      const areaOffsetX = currentX + CONFIG.areaPadding;
      const startZ = currentZ + CONFIG.areaPadding;

      const areaGroup = new THREE.Group();
      areaGroup.name = `Area_${areaData.areaName}`;

      const areaCells = [];
      areaData.rows.forEach(r => r.levels.forEach(l => areaCells.push(...l.cells)));
      const areaMetrics = Utils.calculateMetrics(areaCells);
      const areaSummary = { type: 'area', areaName: areaData.areaName, totalRows: areaData.rows.length, ...areaMetrics };
      areaGroup.userData = areaSummary;

      const areaColor = Utils.getAreaColor(areaIdx, areaData);

      areaData.rows.forEach((rowData, rowIdx) => {
        const rowGroup = new THREE.Group();
        rowGroup.name = `Row_${rowData.rowName}`;

        const rowCells = [];
        rowData.levels.forEach(l => rowCells.push(...l.cells));
        const rowMetrics = Utils.calculateMetrics(rowCells);
        const rowSummary = { type: 'row', rowName: rowData.rowName, areaName: areaData.areaName, totalLevels: rowData.levels.length, ...rowMetrics };
        rowGroup.userData = rowSummary;

        const sampleCell = rowData.levels[0]?.cells[0];
        const rowCellDepth = sampleCell ? (sampleCell.depth * CONFIG.scaleFactor) : 10;
        const zOffset = startZ + rowIdx * (rowCellDepth + CONFIG.rowGap);
        let currentYOffset = 0;

        rowData.levels.forEach((levelData) => {
          const levelGroup = new THREE.Group();
          levelGroup.name = `Level_${levelData.levelName}`;
          let firstCellX = 0, lastCellX = 0, levelMaxHeight = 0;

          levelData.cells.forEach((cellData, cellIdx) => {
            const w = cellData.width * CONFIG.scaleFactor;
            const h = cellData.height * CONFIG.scaleFactor;
            const d = cellData.depth * CONFIG.scaleFactor;
            levelMaxHeight = Math.max(levelMaxHeight, h);

            const xOffset = (cellData.place - 1) * (w + CONFIG.cellGap);
            if (cellIdx === 0) firstCellX = areaOffsetX + xOffset;
            lastCellX = areaOffsetX + xOffset + w;

            const geometry = new THREE.BoxGeometry(w, h, d);
            const material = new THREE.MeshStandardMaterial({
              color: cellData.active ? areaColor : colors.inactive,
              roughness: 0.3,
              metalness: 0.1,
              transparent: true,
              opacity: cellData.active ? 0.9 : 0.4
            });

            const cellMesh = new THREE.Mesh(geometry, material);
            cellMesh.position.set(areaOffsetX + xOffset + w / 2, currentYOffset + h / 2, zOffset + d / 2);
            cellMesh.userData = {
              type: 'cell',
              data: cellData,
              areaName: areaData.areaName,
              areaSummary,
              rowName: rowData.rowName,
              levelName: levelData.levelName
            };

            levelGroup.add(cellMesh);
          });

          const levelText = `${levelData.level}`;
          const labelCenterY = currentYOffset + (levelMaxHeight / 2);

          const leftLevelMesh = Utils.createSideLevelLabel(levelText, 6, 6);
          leftLevelMesh.rotation.y = -Math.PI / 2;
          leftLevelMesh.position.set(firstCellX - 0.05, labelCenterY, zOffset + rowCellDepth / 2);
          scene.add(leftLevelMesh);
          levelLabels.push(leftLevelMesh);

          const rightLevelMesh = Utils.createSideLevelLabel(levelText, 6, 6);
          rightLevelMesh.rotation.y = Math.PI / 2;
          rightLevelMesh.position.set(lastCellX + 0.05, labelCenterY, zOffset + rowCellDepth / 2);
          scene.add(rightLevelMesh);
          levelLabels.push(rightLevelMesh);

          rowGroup.add(levelGroup);
          currentYOffset += levelMaxHeight + CONFIG.cellGap;
        });

        const floorRowLabel = Utils.createFloorLabelMesh(rowData.rowName, areaColor, 36, 12, 140);
        floorRowLabel.position.set(areaOffsetX + dims.maxRowX + 18, 0.02, zOffset + 5);
        floorRowLabel.userData = rowSummary;

        rowGroup.add(floorRowLabel);
        rowLabels.push(floorRowLabel);
        areaGroup.add(rowGroup);
      });

      const minX = currentX, maxX = currentX + dims.totalWidth;
      const minZ = currentZ, maxZ = currentZ + dims.totalDepth;
      const areaCenterX = minX + dims.totalWidth / 2;
      const areaCenterZ = minZ + dims.totalDepth / 2;

      const areaRectGeo = new THREE.PlaneGeometry(dims.totalWidth, dims.totalDepth);
      const areaRectMat = new THREE.MeshBasicMaterial({ color: areaColor, transparent: true, opacity: 0.07, side: THREE.DoubleSide });
      const areaRectMesh = new THREE.Mesh(areaRectGeo, areaRectMat);
      areaRectMesh.rotation.x = -Math.PI / 2;
      areaRectMesh.position.set(areaCenterX, 0.01, areaCenterZ);
      scene.add(areaRectMesh);

      const borderLines = new THREE.LineSegments(new THREE.EdgesGeometry(areaRectGeo), new THREE.LineBasicMaterial({ color: areaColor, linewidth: 3 }));
      borderLines.rotation.x = -Math.PI / 2;
      borderLines.position.set(areaCenterX, 0.02, areaCenterZ);
      scene.add(borderLines);

      [{ x: Math.round(minX), z: Math.round(minZ) },
       { x: Math.round(maxX), z: Math.round(minZ) },
       { x: Math.round(minX), z: Math.round(maxZ) },
       { x: Math.round(maxX), z: Math.round(maxZ) }].forEach(c => {
        const cornerLabel = createCornerLabel(`(${c.x}, ${c.z})`, areaColor);
        cornerLabel.position.set(c.x, 1.0, c.z);
        areaGroup.add(cornerLabel);
      });

      const labelText = `${t('area').toUpperCase()} ${areaData.areaName}`;
      const areaTitleMesh = Utils.createFloorLabelMesh(labelText, areaColor, 64, 16, 150);
      areaTitleMesh.position.set(areaCenterX, 0.03, maxZ - CONFIG.areaPadding / 2);
      areaTitleMesh.userData = areaSummary;

      areaGroup.add(areaTitleMesh);
      areaLabels.push(areaTitleMesh);
      warehouseGroup.add(areaGroup);

      currentX += dims.totalWidth + CONFIG.areaGap;
    });
  }

  return { buildWarehouse, rowLabels, levelLabels, areaLabels };
})();