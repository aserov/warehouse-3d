window.WH = window.WH || {};
WH.webgl = WH.webgl || {};
WH.webgl.builders = WH.webgl.builders || {};

(function() {
  function buildLevelGroup({
    levelData, rowName, areaName, floor, direction, orientation, align,
    rowBounds, areaColor, currentYOffset, registry,
  }) {
    const levelGroup = new THREE.Group();
    levelGroup.name = `Level_${levelData.levelName}`;

    const isVertical = orientation === WH.config.ORIENTATION.Vertical;
    const levelMetrics = WH.utils.calculateMetrics(levelData.cells);

    let levelMaxHeight = 0;
    let levelFootprint = 0;
    let firstCellPos = null;
    let lastCellPos = null;

    const sortedCells = [...levelData.cells].sort((a, b) => a.place - b.place);
    let cursor = 0;

    sortedCells.forEach((cellData) => {
      const cellScale = WH.utils.getScaleFactor(cellData.measurement);
      const w = cellData.width * cellScale;
      const h = cellData.height * cellScale;
      const d = cellData.depth * cellScale;
      levelMaxHeight = Math.max(levelMaxHeight, h);

      const axisSize = w;
      const crossSize = d;
      levelFootprint += axisSize * crossSize;

      const offsetAlongAxis = cursor;
      cursor += axisSize + WH.config.WAREHOUSE_CONFIG.cellGap;

      const { x: posX, z: posZ } = WH.webgl.builders.calculateCellPosition({
        direction, align, isVertical, offsetAlongAxis, axisSize, crossSize, rowBounds,
      });

      if (!firstCellPos) firstCellPos = { x: posX, z: posZ };
      lastCellPos = { x: posX, z: posZ };

      const boxSizeX = isVertical ? crossSize : axisSize;
      const boxSizeZ = isVertical ? axisSize : crossSize;

      const cellMesh = WH.webgl.builders.buildCellMesh({
        cellData, boxSizeX, boxSizeZ, h,
        posX, posY: currentYOffset + h / 2, posZ,
        areaColor, areaName, rowName, levelName: levelData.levelName,
      });

      levelGroup.add(cellMesh);
    });

    const levelSummary = {
      type: 'level',
      levelName: levelData.levelName,
      rowName, areaName, floor, direction, orientation,
      footprint: levelFootprint,
      maxCellHeight: levelMaxHeight,
      color: areaColor,
      ...levelMetrics,
    };

    attachLevelLabels({
      levelGroup,
      levelText: `${levelData.level}`,
      labelCenterY: currentYOffset + levelMaxHeight / 2,
      firstCellPos, lastCellPos, cursor, isVertical, direction, rowBounds,
      levelSummary, registry,
    });

    return { levelGroup, levelMaxHeight, levelFootprint };
  }

  function attachLevelLabels({
    levelGroup, levelText, labelCenterY, firstCellPos, lastCellPos,
    cursor, isVertical, direction, rowBounds, levelSummary, registry,
  }) {
    if (!firstCellPos || !lastCellPos) return;

    const totalLayoutLength = cursor - WH.config.WAREHOUSE_CONFIG.cellGap;
    const { LeftToRight, TopToBottom } = WH.config.DIRECTION;

    if (!isVertical) {
      const startEdgeX = direction === LeftToRight ? rowBounds.minX : rowBounds.maxX;
      const endEdgeX = direction === LeftToRight ? startEdgeX + totalLayoutLength : startEdgeX - totalLayoutLength;
      const leftEdgeX = Math.min(startEdgeX, endEdgeX);
      const rightEdgeX = Math.max(startEdgeX, endEdgeX);

      const leftPos = firstCellPos.x <= lastCellPos.x ? firstCellPos : lastCellPos;
      const rightPos = firstCellPos.x <= lastCellPos.x ? lastCellPos : firstCellPos;

      const leftLevelMesh = WH.webgl.builders.createSideLevelLabel(levelText);
      leftLevelMesh.rotation.y = -Math.PI / 2;
      leftLevelMesh.position.set(leftEdgeX - 0.05, labelCenterY, leftPos.z);
      leftLevelMesh.userData = levelSummary;
      leftLevelMesh.userData.initialOpacity = 1.0;
      levelGroup.add(leftLevelMesh);
      registry.levelLabels.push(leftLevelMesh);

      const rightLevelMesh = WH.webgl.builders.createSideLevelLabel(levelText);
      rightLevelMesh.rotation.y = Math.PI / 2;
      rightLevelMesh.position.set(rightEdgeX + 0.05, labelCenterY, rightPos.z);
      rightLevelMesh.userData = levelSummary;
      rightLevelMesh.userData.initialOpacity = 1.0;
      levelGroup.add(rightLevelMesh);
      registry.levelLabels.push(rightLevelMesh);
    } else {
      const startEdgeZ = direction === TopToBottom ? rowBounds.minZ : rowBounds.maxZ;
      const endEdgeZ = direction === TopToBottom ? startEdgeZ + totalLayoutLength : startEdgeZ - totalLayoutLength;
      const topEdgeZ = Math.min(startEdgeZ, endEdgeZ);
      const bottomEdgeZ = Math.max(startEdgeZ, endEdgeZ);

      const topPos = firstCellPos.z <= lastCellPos.z ? firstCellPos : lastCellPos;
      const bottomPos = firstCellPos.z <= lastCellPos.z ? lastCellPos : firstCellPos;

      const topLevelMesh = WH.webgl.builders.createSideLevelLabel(levelText);
      topLevelMesh.position.set(topPos.x, labelCenterY, topEdgeZ - 0.05);
      topLevelMesh.userData = levelSummary;
      topLevelMesh.userData.initialOpacity = 1.0;
      levelGroup.add(topLevelMesh);
      registry.levelLabels.push(topLevelMesh);

      const bottomLevelMesh = WH.webgl.builders.createSideLevelLabel(levelText);
      bottomLevelMesh.position.set(bottomPos.x, labelCenterY, bottomEdgeZ + 0.05);
      bottomLevelMesh.userData = levelSummary;
      bottomLevelMesh.userData.initialOpacity = 1.0;
      levelGroup.add(bottomLevelMesh);
      registry.levelLabels.push(bottomLevelMesh);
    }
  }

  WH.webgl.builders.buildLevelGroup = buildLevelGroup;
})();