window.WH = window.WH || {};
WH.webgl = WH.webgl || {};
WH.webgl.builders = WH.webgl.builders || {};

(function() {
  function getAreaColor(index) {
    const palette = WH.config.WAREHOUSE_CONFIG.colors.areaPalette;
    return palette[index % palette.length];
  }

  WH.webgl.builders.buildAreaGroup = function({ areaData, index, floor, warehouseName, registry }) {
    const areaGroup = new THREE.Group();
    areaGroup.name = `Area_${areaData.areaName}`;

    const areaColor = getAreaColor(index);

    const areaCells = areaData.rows.flatMap((row) => row.levels.flatMap((level) => level.cells));
    const areaMetrics = WH.utils.calculateMetrics(areaCells);

    const areaSummary = {
      type: 'area',
      areaName: areaData.areaName,
      floor, warehouseName,
      totalRows: areaData.rows.length,
      polygonArea: WH.utils.getPolygonArea(areaData.polygon),
      usedArea: 0,
      rowsPolygonArea: 0,
      color: areaColor,
      ...areaMetrics,
    };

    areaData.rows.forEach((rowData) => {
      if (!rowData.polygon || rowData.polygon.length < 3) return;

      const { rowGroup, rowSummary } = WH.webgl.builders.buildRowGroup({
        rowData, areaName: areaData.areaName, floor, warehouseName, areaColor, registry,
      });

      areaSummary.usedArea += rowSummary.usedArea;
      areaSummary.rowsPolygonArea += rowSummary.polygonArea;

      areaGroup.add(rowGroup);
    });

    WH.webgl.builders.createAreaShape(areaGroup, areaData.polygon, areaColor, registry);

    const bounds = WH.webgl.builders.getPolygonBounds(areaData.polygon);
    const areaBottomCenterX = WH.webgl.builders.getPolygonBottomCenterX(areaData.polygon, bounds);

    const areaTitleMesh = WH.webgl.builders.createFloorLabelMesh(areaData.labelText, WH.utils.toHexColor(areaColor), 16, 150);
    areaTitleMesh.position.set(areaBottomCenterX, 0.1, bounds.maxZ - WH.config.WAREHOUSE_CONFIG.areaPadding / 2);
    areaTitleMesh.userData = areaSummary;
    areaTitleMesh.userData.initialOpacity = 1.0;
    areaGroup.add(areaTitleMesh);
    registry.areaLabels.push(areaTitleMesh);

    return { areaGroup, areaSummary, areaMetrics };
  };
})();