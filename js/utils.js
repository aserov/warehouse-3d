window.Warehouse = window.Warehouse || {};

window.Warehouse.Utils = {
  /**
   * Calculates the scale factor converting scene units to meters.
   * Priority: explicit scale property > measurement string unit.
   * @param {string} [measurement] - Unit string ('m', 'cm', 'sm', 'mm').
   * @param {number} [explicitScale] - Direct scale factor specified in warehouse config.
   * @returns {number} Scale factor for coordinate conversion.
   */
  getScaleFactor(measurement, explicitScale) {
    if (typeof explicitScale === 'number' && explicitScale > 0) {
      return explicitScale;
    }

    if (typeof measurement === 'string') {
      const unit = measurement.toLowerCase().trim();
      switch (unit) {
        case 'm':
          return 1.0;
        case 'cm':
        case 'sm':
          return 0.01;
        case 'mm':
          return 0.001;
      }
    }

    return 1;
  },

  // Get localized string by key
  t(key) {
    const lang = window.Warehouse.CONFIG.defaultLang || 'ru';
    const dict = window.Warehouse.i18n[lang] || window.Warehouse.i18n['ru'];
    return dict[key] || key;
  },

  // Get unit of measurement from localized dictionary
  getUnit(unitKey) {
    const lang = window.Warehouse.CONFIG.defaultLang || 'ru';
    const dict = window.Warehouse.i18n[lang] || window.Warehouse.i18n['ru'];
    return (dict.units && dict.units[unitKey]) ? dict.units[unitKey] : '';
  },

  getAreaColor(areaIndex, areaData) {
    const palette = window.Warehouse.CONFIG.colors.areaPalette;
    if (areaData && areaData.color) return areaData.color;
    return palette[areaIndex % palette.length];
  },

  calculateCellVolume(w, h, d) {
    return (w * h * d) / 1e9; // mm³ -> m³
  },

  formatNumber(val, decimals = 1) {
    if (val === undefined || val === null) return '0';
    const lang = window.Warehouse.CONFIG.defaultLang === 'ru' ? 'ru-RU' : 'en-US';
    return Number(val).toLocaleString(lang, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
  },

  calculateMetrics(cellsList) {
    let totalCells = cellsList.length;
    let activeCells = 0;
    let totalWeight = 0;
    let totalFreeWeight = 0;
    let totalVolume = 0;

    cellsList.forEach(c => {
      if (c.active === 1) activeCells++;
      totalWeight += (c.weight || 0);
      totalFreeWeight += (c.freeWeight || 0);

      const vol = this.calculateCellVolume(c.width || 0, c.height || 0, c.depth || 0);
      totalVolume += vol;
    });

    const occupiedWeight = totalWeight - totalFreeWeight;

    return {
      totalCells,
      activeCells,
      inactiveCells: totalCells - activeCells,
      totalWeight,
      totalFreeWeight,
      occupiedWeight: occupiedWeight < 0 ? 0 : occupiedWeight,
      totalVolume
    };
  },

  createTextTexture(text, color = '#ffffff', fontSize = 140, strokeColor = null, isCondensed = false) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1024;
    canvas.height = 256;

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

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  },

  createSideLevelLabel(text, width = 6, height = 6) {
    const texture = this.createTextTexture(text, '#ffffff', 180, 'rgba(0,0,0,0.85)', true);
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    return new THREE.Mesh(geometry, material);
  },

  createFloorLabelMesh(text, color, width = 60, height = 20, fontSize = 140) {
    const texture = this.createTextTexture(text, color, fontSize);
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }
};
