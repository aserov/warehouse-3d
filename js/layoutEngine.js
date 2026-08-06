window.Warehouse = window.Warehouse || {};

window.Warehouse.LayoutEngine = {
  calculateAreaDimensions(areaData) {
    const { CONFIG } = window.Warehouse;
    let maxRowX = 0;
    let maxRowZ = 0;

    areaData.rows.forEach((rowData, rowIdx) => {
      const zOffset = rowIdx * (10 + CONFIG.rowGap);
      maxRowZ = Math.max(maxRowZ, zOffset + 10);

      rowData.levels.forEach((levelData) => {
        levelData.cells.forEach((cellData) => {
          const w = cellData.width * CONFIG.scaleFactor;
          const xOffset = (cellData.place - 1) * (w + CONFIG.cellGap);
          maxRowX = Math.max(maxRowX, xOffset + w);
        });
      });
    });

    const labelMarginX = 36;
    const labelMarginZ = 20;

    const netWidth = maxRowX + labelMarginX;
    const netDepth = maxRowZ + labelMarginZ;

    return {
      maxRowX,
      maxRowZ,
      totalWidth: netWidth + CONFIG.areaPadding * 2,
      totalDepth: netDepth + CONFIG.areaPadding * 2
    };
  },

  // NOTE: no longer called anywhere - it was only used by the old auto-packing
  // layout algorithm for areas, which has been replaced by per-area polygons
  // from the server. Left in place as a candidate for cleanup later.
  getMinWallWidthForZRange(polygon, startZ, depth) {
    let minAllowedX = Infinity;
    const steps = 5;

    for (let i = 0; i <= steps; i++) {
      const z = startZ + (depth / steps) * i;
      let maxXAtZ = 0;

      for (let j = 0; j < polygon.length; j++) {
        const p1 = polygon[j];
        const p2 = polygon[(j + 1) % polygon.length];

        if ((p1.z <= z && p2.z >= z) || (p2.z <= z && p1.z >= z)) {
          if (p1.z !== p2.z) {
            const x = p1.x + (z - p1.z) * (p2.x - p1.x) / (p2.z - p1.z);
            maxXAtZ = Math.max(maxXAtZ, x);
          } else {
            maxXAtZ = Math.max(maxXAtZ, p1.x, p2.x);
          }
        }
      }

      if (maxXAtZ > 0) {
        minAllowedX = Math.min(minAllowedX, maxXAtZ);
      }
    }

    return minAllowedX === Infinity ? 0 : minAllowedX;
  },

  /**
   * Checks whether a polygon has enough points to be drawable (>= 3).
   * @param {Array<{x:number,z:number}>} polygon
   */
  isValidPolygon(polygon) {
    return Array.isArray(polygon) && polygon.length >= 3;
  },

  /**
   * Computes the axis-aligned bounding box of a polygon (used to place rows/cells
   * inside an area whose visual shape comes directly from its own polygon).
   * @param {Array<{x:number,z:number}>} polygon
   * @returns {{minX:number,maxX:number,minZ:number,maxZ:number,width:number,depth:number}}
   */
  getPolygonBounds(polygon) {
    const xs = polygon.map(p => p.x);
    const zs = polygon.map(p => p.z);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    return { minX, maxX, minZ, maxZ, width: maxX - minX, depth: maxZ - minZ };
  }
};
