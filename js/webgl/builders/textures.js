window.WH = window.WH || {};
WH.webgl = WH.webgl || {};
WH.webgl.builders = WH.webgl.builders || {};

(function() {
  const stripeTextureCache = new Map();

  function getOrCreateStripeTexture(baseColor) {
    if (stripeTextureCache.has(baseColor)) {
      return stripeTextureCache.get(baseColor);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const color = new THREE.Color(baseColor);
    ctx.fillStyle = `#${color.getHexString()}`;
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    const stripeWidth = 32;

    ctx.beginPath();
    for (let i = -256; i < 512; i += stripeWidth * 2) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i + stripeWidth, 0);
      ctx.lineTo(i + stripeWidth - 256, 256);
      ctx.lineTo(i - 256, 256);
    }
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    stripeTextureCache.set(baseColor, texture);
    return texture;
  }

  function createTextTexture(text, color = '#ffffff', fontSize = 140, strokeColor = null, isCondensed = false) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1024;
    canvas.height = 256;

    if (ctx) {
      ctx.save();

      if (isCondensed) {
        ctx.scale(1.0, 0.65);
        ctx.font = `Bold ${fontSize * 1.3}px Arial Black, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (strokeColor) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 14;
          ctx.strokeText(text, 512, 128 / 0.65);
        }

        ctx.fillStyle = color;
        ctx.fillText(text, 512, 128 / 0.65);
      } else {
        ctx.font = `Bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (strokeColor) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 14;
          ctx.strokeText(text, 512, 128);
        }

        ctx.fillStyle = color;
        ctx.fillText(text, 512, 128);
      }

      ctx.restore();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  function createFloorLabelMesh(text, color, height = 20, fontSize = 120, explicitWidth) {
    const texture = createTextTexture(text, color, fontSize);

    const image = texture.image;
    const aspectRatio = image ? image.width / image.height : 4;
    const calculatedWidth = explicitWidth ?? height * aspectRatio;

    const geometry = new THREE.PlaneGeometry(calculatedWidth, height);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }

  function createSideLevelLabel(text, width = 6, height = 6) {
    const texture = createTextTexture(text, '#ffffff', 180, 'rgba(0,0,0,0.85)', true);
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    return new THREE.Mesh(geometry, material);
  }

  function createCornerLabel(text, color) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;

    if (ctx) {
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
    }

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(12, 6, 1);
    return sprite;
  }

  WH.webgl.builders.getOrCreateStripeTexture = getOrCreateStripeTexture;
  WH.webgl.builders.createTextTexture = createTextTexture;
  WH.webgl.builders.createFloorLabelMesh = createFloorLabelMesh;
  WH.webgl.builders.createSideLevelLabel = createSideLevelLabel;
  WH.webgl.builders.createCornerLabel = createCornerLabel;
})();