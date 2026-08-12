window.WH = window.WH || {};
WH.webgl = WH.webgl || {};

// Builds labeled coordinate axes (x, y, z) at the origin (0,0,0).
// Color and length come from WH.config.WAREHOUSE_CONFIG.axes.
WH.webgl.buildAxes = (function() {
  function createLabelSprite(text, colorHex) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 96px sans-serif';
    ctx.fillStyle = colorHex;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, size / 2, size / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.renderOrder = 999;
    return sprite;
  }

  function addAxis(group, direction, length, labelText, labelScale, colorNum, colorHex) {
    const arrow = new THREE.ArrowHelper(
      direction.clone().normalize(),
      new THREE.Vector3(0, 0, 0),
      length,
      colorNum,
      length * 0.15,
      length * 0.08,
    );
    arrow.line.material.linewidth = 2;
    group.add(arrow);

    const label = createLabelSprite(labelText, colorHex);
    label.scale.set(labelScale, labelScale, 1);
    label.position.copy(direction.clone().normalize().multiplyScalar(length * 1.15));
    group.add(label);
  }

  return function buildAxes(scene) {
    const axesCfg = WH.config.WAREHOUSE_CONFIG.axes;
    const length = axesCfg.length;
    const labelScale = length * 0.25;
    const colorNum = axesCfg.color;
    const colorHex = '#' + colorNum.toString(16).padStart(6, '0');

    const group = new THREE.Group();
    group.name = 'AxesHelper';

    addAxis(group, new THREE.Vector3(1, 0, 0), length, 'x', labelScale, colorNum, colorHex);
    addAxis(group, new THREE.Vector3(0, 1, 0), length, 'y', labelScale, colorNum, colorHex);
    addAxis(group, new THREE.Vector3(0, 0, 1), length, 'z', labelScale, colorNum, colorHex);

    scene.add(group);
    return group;
  };
})();