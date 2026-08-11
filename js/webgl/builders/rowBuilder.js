window.WH = window.WH || {};
WH.webgl = WH.webgl || {};
WH.webgl.builders = WH.webgl.builders || {};

WH.webgl.builders.buildRowGroup = function({ rowData, areaName, floor, warehouseName, areaColor, registry }) {
  const rowGroup = new THREE.Group();
  rowGroup.name = `Row_${rowData.rowName}`;

  const rowBounds = WH.webgl.builders.getPolygonBounds(rowData.polygon);
  const direction = WH.webgl.builders.resolveDirection(rowData.direction, rowData.rowName);
  const isVertical = WH.webgl.builders.isVerticalDirection(direction);
  const orientation = isVertical ? WH.config.ORIENTATION.Vertical : WH.config.ORIENTATION.Horizontal;
  const align = WH.webgl.builders.resolveAlign(rowData.align, isVertical);

  const rowCells = rowData.levels.flatMap((level) => level.cells);
  const rowMetrics = WH.utils.calculateMetrics(rowCells);

  const rowSummary = {
    type: 'row',
    rowName: rowData.rowName,
    areaName, floor, warehouseName,
    totalLevels: rowData.levels.length,
    direction, orientation,
    polygonArea: WH.utils.getPolygonArea(rowData.polygon),
    usedArea: 0,
    color: areaColor,
    ...rowMetrics,
  };

  const levelFootprints = {};
  let currentYOffset = 0;

  rowData.levels.forEach((levelData) => {
    const { levelGroup, levelMaxHeight, levelFootprint } = WH.webgl.builders.buildLevelGroup({
      levelData, rowName: rowData.rowName, areaName, floor, direction, orientation, align,
      rowBounds, areaColor, currentYOffset, registry,
    });

    levelFootprints[levelData.level] = levelFootprint;
    rowGroup.add(levelGroup);
    currentYOffset += levelMaxHeight + WH.config.WAREHOUSE_CONFIG.cellGap;
  });

  const levelNumbers = Object.keys(levelFootprints).map(Number);
  rowSummary.usedArea = levelNumbers.length > 0 ? levelFootprints[Math.min(...levelNumbers)] : 0;

  WH.webgl.builders.createRowShape(rowGroup, rowData.polygon, areaColor, registry);

  const floorRowLabel = WH.webgl.builders.createFloorLabelMesh(rowData.rowName, WH.utils.toHexColor(areaColor), 12, 140, 36);
  const labelBox = new THREE.Box3().setFromObject(floorRowLabel);
  const labelHeight = labelBox.max.z - labelBox.min.z;

  floorRowLabel.position.set(rowBounds.maxX + 10, 0.09, rowBounds.maxZ - labelHeight / 2);
  floorRowLabel.userData = rowSummary;
  floorRowLabel.userData.initialOpacity = 1.0;
  rowGroup.add(floorRowLabel);
  registry.rowLabels.push(floorRowLabel);

  return { rowGroup, rowSummary };
};