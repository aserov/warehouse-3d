window.WH = window.WH || {};
WH.utils = WH.utils || {};

WH.utils.calculateCellVolume = function(width, height, depth) {
  return (width * height * depth) / 1e9;
};

WH.utils.calculateMetrics = function(cells) {
  let activeCells = 0;
  let totalWeight = 0;
  let totalFreeWeight = 0;
  let totalVolume = 0;

  cells.forEach((cell) => {
    if (cell.active === 1) activeCells += 1;
    totalWeight += cell.weight || 0;
    totalFreeWeight += cell.freeWeight || 0;
    totalVolume += WH.utils.calculateCellVolume(cell.width || 0, cell.height || 0, cell.depth || 0);
  });

  const totalCells = cells.length;
  const occupiedWeight = totalWeight - totalFreeWeight;

  return {
    totalCells,
    activeCells,
    inactiveCells: totalCells - activeCells,
    totalWeight,
    totalFreeWeight,
    occupiedWeight: occupiedWeight < 0 ? 0 : occupiedWeight,
    totalVolume,
  };
};

WH.utils.getPolygonArea = function(polygon) {
  if (!polygon || polygon.length < 3) return 0;

  let sum = 0;
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];
    sum += p1.x * p2.z - p2.x * p1.z;
  }

  return Math.abs(sum) / 2;
};