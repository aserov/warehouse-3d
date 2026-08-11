window.WH = window.WH || {};
WH.webgl = WH.webgl || {};
WH.webgl.builders = WH.webgl.builders || {};

WH.webgl.builders.buildCellMesh = function({
  cellData, boxSizeX, boxSizeZ, h, posX, posY, posZ, areaColor, areaName, rowName, levelName,
}) {
  const baseOpacity = cellData.active ? 0.9 : 0.75;
  const geometry = new THREE.BoxGeometry(boxSizeX, h, boxSizeZ);
  let material;

  if (cellData.active) {
    material = new THREE.MeshStandardMaterial({
      color: areaColor,
      roughness: 0.3,
      metalness: 0.1,
      transparent: true,
      opacity: baseOpacity,
    });
  } else {
    material = new THREE.MeshStandardMaterial({
      map: WH.webgl.builders.getOrCreateStripeTexture(areaColor),
      roughness: 0.4,
      metalness: 0.1,
      transparent: true,
      opacity: baseOpacity,
    });
  }

  const cellMesh = new THREE.Mesh(geometry, material);
  cellMesh.position.set(posX, posY, posZ);

  cellMesh.userData = { type: 'cell', data: cellData, areaName, rowName, levelName };
  cellMesh.userData.initialOpacity = baseOpacity;

  return cellMesh;
};