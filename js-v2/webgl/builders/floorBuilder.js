window.WH = window.WH || {};
WH.webgl = WH.webgl || {};
WH.webgl.builders = WH.webgl.builders || {};

(function() {
  const VALID_DIRECTIONS = Object.values(WH.config.DIRECTION);
  const VALID_ALIGNS = Object.values(WH.config.ALIGN);

  function resolveDirection(direction, rowName) {
    if (VALID_DIRECTIONS.includes(direction)) return direction;
    console.warn(`[Warehouse] Row "${rowName}" has invalid direction "${direction}", defaulting to LeftToRight.`);
    return WH.config.DIRECTION.LeftToRight;
  }

  function isVerticalDirection(direction) {
    return direction === WH.config.DIRECTION.TopToBottom || direction === WH.config.DIRECTION.BottomToTop;
  }

  function resolveAlign(align, isVertical) {
    if (align && VALID_ALIGNS.includes(align)) return align;
    return isVertical ? WH.config.ALIGN.Left : WH.config.ALIGN.Top;
  }

  function getPolygonBounds(polygon) {
    const xs = polygon.map((p) => p.x);
    const zs = polygon.map((p) => p.z);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minZ: Math.min(...zs),
      maxZ: Math.max(...zs),
    };
  }

  function getPolygonBottomCenterX(polygon, bounds, threshold = 0.1) {
    const bottomVertices = polygon.filter((p) => Math.abs(p.z - bounds.maxZ) < threshold);
    const bottomMinX = bottomVertices.length ? Math.min(...bottomVertices.map((p) => p.x)) : bounds.minX;
    const bottomMaxX = bottomVertices.length ? Math.max(...bottomVertices.map((p) => p.x)) : bounds.maxX;
    return (bottomMinX + bottomMaxX) / 2;
  }

  function calculateCellPosition({ direction, align, isVertical, offsetAlongAxis, axisSize, crossSize, rowBounds }) {
    const { LeftToRight, TopToBottom } = WH.config.DIRECTION;
    const { Bottom, Center, Right } = WH.config.ALIGN;

    if (!isVertical) {
      const posX = direction === LeftToRight
        ? rowBounds.minX + offsetAlongAxis + axisSize / 2
        : rowBounds.maxX - offsetAlongAxis - axisSize / 2;

      let posZ = rowBounds.minZ + crossSize / 2;
      if (align === Bottom) posZ = rowBounds.maxZ - crossSize / 2;
      else if (align === Center) posZ = (rowBounds.minZ + rowBounds.maxZ) / 2;

      return { x: posX, z: posZ };
    }

    const posZ = direction === TopToBottom
      ? rowBounds.minZ + offsetAlongAxis + axisSize / 2
      : rowBounds.maxZ - offsetAlongAxis - axisSize / 2;

    let posX = rowBounds.minX + crossSize / 2;
    if (align === Right) posX = rowBounds.maxX - crossSize / 2;
    else if (align === Center) posX = (rowBounds.minX + rowBounds.maxX) / 2;

    return { x: posX, z: posZ };
  }

  function createBuildingOutline(group, polygon, registry) {
    if (!polygon || polygon.length < 3) return;

    const { buildingFloor, buildingWall } = WH.config.WAREHOUSE_CONFIG.colors;

    const shape = new THREE.Shape();
    shape.moveTo(polygon[0].x, polygon[0].z);
    for (let i = 1; i < polygon.length; i++) shape.lineTo(polygon[i].x, polygon[i].z);
    shape.closePath();

    const floorGeometry = new THREE.ShapeGeometry(shape);
    const floorMaterial = new THREE.MeshBasicMaterial({ color: buildingFloor, side: THREE.DoubleSide });
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.rotation.x = Math.PI / 2;
    floorMesh.position.y = -0.01;
    group.add(floorMesh);

    const points3D = polygon.map((p) => new THREE.Vector3(p.x, 0.2, p.z));
    points3D.push(new THREE.Vector3(polygon[0].x, 0.2, polygon[0].z));

    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points3D);
    const lineMaterial = new THREE.LineBasicMaterial({ color: buildingWall });
    const outlineLine = new THREE.Line(lineGeometry, lineMaterial);
    group.add(outlineLine);

    polygon.forEach((point) => {
      const labelSprite = WH.webgl.builders.createCornerLabel(`(${point.x}, ${point.z})`, buildingWall);
      labelSprite.position.set(point.x, 2.0, point.z);
      group.add(labelSprite);
      registry.cornerLabels.push(labelSprite);
    });
  }

  function drawPolygonShape(group, polygon, color, registry, opts = {}) {
    const { fillY = 0.05, lineY = 0.08, fillOpacity = 0.07, lineWidth = 3 } = opts;

    const shape = new THREE.Shape();
    shape.moveTo(polygon[0].x, polygon[0].z);
    for (let i = 1; i < polygon.length; i++) shape.lineTo(polygon[i].x, polygon[i].z);
    shape.closePath();

    const fillGeometry = new THREE.ShapeGeometry(shape);
    const fillMaterial = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: fillOpacity, depthWrite: false, side: THREE.DoubleSide,
    });
    const fillMesh = new THREE.Mesh(fillGeometry, fillMaterial);
    fillMesh.rotation.x = Math.PI / 2;
    fillMesh.position.y = fillY;
    fillMesh.userData.initialOpacity = fillOpacity;
    group.add(fillMesh);

    const points3D = polygon.map((p) => new THREE.Vector3(p.x, lineY, p.z));
    points3D.push(new THREE.Vector3(polygon[0].x, lineY, polygon[0].z));

    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points3D);
    const lineMaterial = new THREE.LineBasicMaterial({ color, linewidth: lineWidth, transparent: true, opacity: 1 });
    const borderLine = new THREE.Line(lineGeometry, lineMaterial);
    borderLine.userData.initialOpacity = 1.0;
    group.add(borderLine);

    polygon.forEach((point) => {
      const cornerLabel = WH.webgl.builders.createCornerLabel(`(${Math.round(point.x)}, ${Math.round(point.z)})`, color);
      cornerLabel.position.set(point.x, lineY + 0.92, point.z);
      cornerLabel.userData.initialOpacity = 1.0;
      group.add(cornerLabel);
      registry.cornerLabels.push(cornerLabel);
    });
  }

  function createAreaShape(group, polygon, color, registry) {
    drawPolygonShape(group, polygon, color, registry, { fillY: 0.05, lineY: 0.08, fillOpacity: 0.07, lineWidth: 3 });
  }

  function createRowShape(group, polygon, color, registry) {
    drawPolygonShape(group, polygon, color, registry, { fillY: 0.06, lineY: 0.09, fillOpacity: 0.12, lineWidth: 2 });
  }

  function buildFloorGroup(group, input, registry) {
    const { polygon, warehouseName, floor, titleText, areas } = input;
    if (!polygon || polygon.length < 3) return;

    createBuildingOutline(group, polygon, registry);

    let floorTotalAreas = 0, floorTotalRows = 0, floorUsedArea = 0, floorAreasPolygonArea = 0;
    let floorTotalCells = 0, floorActiveCells = 0, floorInactiveCells = 0;
    let floorTotalWeight = 0, floorTotalFreeWeight = 0, floorTotalVolume = 0;

    areas.forEach((areaData, index) => {
      if (!areaData.polygon || areaData.polygon.length < 3) return;

      const { areaGroup, areaSummary, areaMetrics } = WH.webgl.builders.buildAreaGroup({
        areaData, index, floor, warehouseName, registry,
      });

      group.add(areaGroup);

      floorTotalAreas += 1;
      floorTotalRows += areaData.rows.length;
      floorUsedArea += areaSummary.usedArea;
      floorAreasPolygonArea += areaSummary.polygonArea;
      floorTotalCells += areaMetrics.totalCells;
      floorActiveCells += areaMetrics.activeCells;
      floorInactiveCells += areaMetrics.inactiveCells;
      floorTotalWeight += areaMetrics.totalWeight;
      floorTotalFreeWeight += areaMetrics.totalFreeWeight;
      floorTotalVolume += areaMetrics.totalVolume;
    });

    const bounds = getPolygonBounds(polygon);
    const bottomCenterX = getPolygonBottomCenterX(polygon, bounds);
    const floorOccupiedWeight = floorTotalWeight - floorTotalFreeWeight;

    const floorSummary = {
      type: 'floor',
      warehouseName, floor,
      totalAreas: floorTotalAreas,
      totalRows: floorTotalRows,
      polygonArea: WH.utils.getPolygonArea(polygon),
      usedArea: floorUsedArea,
      areasPolygonArea: floorAreasPolygonArea,
      totalCells: floorTotalCells,
      activeCells: floorActiveCells,
      inactiveCells: floorInactiveCells,
      totalWeight: floorTotalWeight,
      totalFreeWeight: floorTotalFreeWeight,
      totalVolume: floorTotalVolume,
      occupiedWeight: floorOccupiedWeight < 0 ? 0 : floorOccupiedWeight,
    };

    const titleMesh = WH.webgl.builders.createFloorLabelMesh(titleText, WH.utils.toHexColor(WH.config.WAREHOUSE_CONFIG.colors.buildingWall));
    titleMesh.position.set(bottomCenterX, 0.11, bounds.maxZ + 10);
    titleMesh.userData = floorSummary;
    group.add(titleMesh);
    registry.floorLabels.push(titleMesh);
  }

  WH.webgl.builders.resolveDirection = resolveDirection;
  WH.webgl.builders.isVerticalDirection = isVerticalDirection;
  WH.webgl.builders.resolveAlign = resolveAlign;
  WH.webgl.builders.getPolygonBounds = getPolygonBounds;
  WH.webgl.builders.getPolygonBottomCenterX = getPolygonBottomCenterX;
  WH.webgl.builders.calculateCellPosition = calculateCellPosition;
  WH.webgl.builders.createAreaShape = createAreaShape;
  WH.webgl.builders.createRowShape = createRowShape;
  WH.webgl.builders.buildFloorGroup = buildFloorGroup;
})();