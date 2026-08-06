window.Warehouse = window.Warehouse || {};

window.Warehouse.UIController = (function() {
  const { CONFIG, Utils, Builder, CameraController } = window.Warehouse;

  /**
   * Renders details card in sidebar when an object (area, row, cell) is selected.
   * @param {Object} userData - Metadata associated with the clicked 3D mesh.
   */
  function displayInfo(userData) {
    const infoContent = document.getElementById('info-content');
    if (!infoContent || !userData || !userData.type) return;

    const t = Utils.t.bind(Utils);
    const getUnit = Utils.getUnit.bind(Utils);
    const unitVol = getUnit('volume');
    const unitWeight = getUnit('weight');
    const unitDim = getUnit('dimension');

    if (userData.type === 'area') {
      infoContent.innerHTML = `
        <div class="info-card type-area">
          <h3 class="info-card-header">📦 ${t('area')}: ${userData.areaName}</h3>
          <div class="info-card-subtitle">${t('areaSummary')}</div>
          <hr class="info-card-divider">
          <div class="info-card-list">
            <div>${t('totalRows')}: <strong>${userData.totalRows}</strong></div>
            <div>${t('totalCells')}: <strong>${userData.totalCells}</strong></div>
            <div>${t('totalVolume')}: <strong>${Utils.formatNumber(userData.totalVolume)} ${unitVol}</strong></div>
            <div>${t('totalMaxWeight')}: <strong>${Utils.formatNumber(userData.totalWeight)} ${unitWeight}</strong></div>
          </div>
          <div class="info-badge-list">
            <div class="info-badge-item active"><span>${t('activeCells')}</span><span class="badge-tag">${userData.activeCells}</span></div>
            <div class="info-badge-item ${userData.inactiveCells > 0 ? 'inactive' : 'neutral'}"><span>${t('inactiveCells')}</span><span class="badge-tag">${userData.inactiveCells}</span></div>
          </div>
        </div>`;
    } else if (userData.type === 'row') {
      infoContent.innerHTML = `
        <div class="info-card type-row">
          <h3 class="info-card-header">📊 ${t('row')}: ${userData.rowName}</h3>
          <div class="info-card-subtitle">${t('area')}: <strong>${userData.areaName}</strong></div>
          <hr class="info-card-divider">
          <div class="info-card-list">
            <div>${t('totalLevels')}: <strong>${userData.totalLevels}</strong></div>
            <div>${t('totalCells')}: <strong>${userData.totalCells}</strong></div>
            <div>${t('totalVolume')}: <strong>${Utils.formatNumber(userData.totalVolume)} ${unitVol}</strong></div>
            <div>${t('totalMaxWeight')}: <strong>${Utils.formatNumber(userData.totalWeight)} ${unitWeight}</strong></div>
          </div>
          <div class="info-badge-list">
            <div class="info-badge-item active"><span>${t('activeCells')}</span><span class="badge-tag">${userData.activeCells}</span></div>
            <div class="info-badge-item ${userData.inactiveCells > 0 ? 'inactive' : 'neutral'}"><span>${t('inactiveCells')}</span><span class="badge-tag">${userData.inactiveCells}</span></div>
          </div>
        </div>`;
    } else if (userData.type === 'cell') {
      const cell = userData.data;
      const cellVol = Utils.calculateCellVolume(cell.width, cell.height, cell.depth);
      infoContent.innerHTML = `
        <div class="info-card type-cell">
          <h3 class="info-card-header">🏷️ ${t('cell')}: ${cell.number}</h3>
          <div class="info-card-subtitle">${t('area')}: <strong>${userData.areaName}</strong> | ${t('row')}: <strong>${userData.rowName}</strong> | ${t('level')}: <strong>${userData.levelName}</strong></div>
          <div class="info-status-row">
            <span>${t('status')}:</span>
            <span class="badge-tag ${cell.active ? 'tag-active' : 'tag-inactive'}">${cell.active ? t('active') : t('inactive')}</span>
          </div>
          <hr class="info-card-divider">
          <div class="info-card-list">
            <div>${t('position')}: <strong>${cell.place}</strong></div>
            <div>${t('totalVolume')}: <strong>${Utils.formatNumber(cellVol, 2)} ${unitVol}</strong></div>
            <div>${t('totalMaxWeight')}: <strong>${Utils.formatNumber(cell.weight, 0)} ${unitWeight}</strong></div>
            <div>${t('totalFreeWeight')}: <strong>${Utils.formatNumber(cell.freeWeight, 0)} ${unitWeight}</strong></div>
            <div>${t('dimensions')}: <strong>${cell.width}×${cell.height}×${cell.depth} ${unitDim}</strong></div>
          </div>
        </div>`;
    }
  }

  /**
   * Applies active language translations to elements with data-i18n attribute.
   */
  function applyTranslations() {
    const currentLang = CONFIG.defaultLang || 'en';
    const dictionary = window.Warehouse.i18n[currentLang] || window.Warehouse.i18n.en;

    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translatedText = dictionary[key];

      if (!translatedText) return;

      const input = element.querySelector('input');
      if (input) {
        element.textContent = ' ' + translatedText;
        element.prepend(input);
      } else {
        element.textContent = translatedText;
      }
    });
  }

  /**
   * Initializes real-time clock updating in top toolbar.
   */
  function startClock() {
    const clockEl = document.getElementById('toolbar-clock');
    if (!clockEl) return;

    function updateTime() {
      const lang = CONFIG.defaultLang || 'en';
      const now = new Date();

      const days = lang === 'ru'
        ? ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      const months = lang === 'ru'
        ? ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const dayName = days[now.getDay()];
      const monthName = months[now.getMonth()];
      const dayNum = String(now.getDate()).padStart(2, '0');
      const year = now.getFullYear();

      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');

      let timeZoneStr = 'Berlin Standard Time';
      try {
        const timeZoneMatch = Intl.DateTimeFormat(lang, { timeZoneName: 'long' })
          .formatToParts(now)
          .find(p => p.type === 'timeZoneName');
        if (timeZoneMatch) timeZoneStr = timeZoneMatch.value;
      } catch (e) {}

      clockEl.textContent = `${dayName} ${monthName} ${dayNum} ${year} ${hours}:${mins}:${secs} (${timeZoneStr})`;
    }

    updateTime();
    setInterval(updateTime, 1000);
  }

  /**
   * Displays modal error overlay when loading fails.
   */
  function showErrorUI(title, details) {
    let errorBox = document.getElementById('error-banner') || document.createElement('div');
    errorBox.id = 'error-banner';
    document.body.appendChild(errorBox);

    errorBox.innerHTML = `
      <div class="error-content">
        <div class="error-header"><strong>${title}</strong></div>
        <p>${details}</p>
        <button onclick="location.reload()">Retry</button>
      </div>`;
    errorBox.classList.add('visible');
  }

  /**
   * Dynamically populates floor selector dropdown items based on backend data.
   * @param {Array<number|string>} floors - List of available floor numbers.
   * @param {number|string} activeFloor - Currently selected floor.
   * @param {Function} onFloorChange - Callback invoked when a floor is clicked.
   */
  function populateFloors(floors, activeFloor, onFloorChange) {
    const floorMenu = document.getElementById('floor-dropdown-menu');
    const currentText = document.getElementById('floor-current-text');
    if (!floorMenu || !currentText) return;

    floorMenu.innerHTML = '';

    // Determine localized floor prefix
    const lang = (CONFIG && CONFIG.defaultLang) || 'ru';
    const floorPrefix = lang === 'ru' ? 'Этаж' : 'Floor';

    floors.forEach(floor => {
      const item = document.createElement('div');
      item.className = `floor-option ${Number(floor) === Number(activeFloor) ? 'active' : ''}`;
      item.setAttribute('data-value', floor);
      item.textContent = `${floorPrefix} ${floor}`;

      item.addEventListener('click', (e) => {
        e.stopPropagation();

        floorMenu.querySelectorAll('.floor-option').forEach(opt => opt.classList.remove('active'));
        item.classList.add('active');

        currentText.textContent = `${floorPrefix} ${floor}`;
        document.getElementById('custom-floor-select')?.classList.remove('open');

        if (typeof onFloorChange === 'function') {
          onFloorChange(floor);
        }
      });

      floorMenu.appendChild(item);
    });

    // Set initial text on button
    currentText.textContent = `${floorPrefix} ${activeFloor}`;
  }

  /**
   * Binds UI control events (toggles, camera views, dropdown listeners).
   */
  function initEvents() {
    // 3D Scene Label Toggles
    document.getElementById('toggle-area-labels')?.addEventListener('change', (e) => {
      Builder.areaLabels.forEach(mesh => mesh.visible = e.target.checked);
    });

    document.getElementById('toggle-row-labels')?.addEventListener('change', (e) => {
      Builder.rowLabels.forEach(mesh => mesh.visible = e.target.checked);
    });

    document.getElementById('toggle-level-labels')?.addEventListener('change', (e) => {
      Builder.levelLabels.forEach(mesh => mesh.visible = e.target.checked);
    });

    // Compass & Zoom Overlay Toggles
    document.getElementById('toggle-compass')?.addEventListener('change', (e) => {
      const compassWidget = document.getElementById('compass-widget');
      if (compassWidget) compassWidget.style.display = e.target.checked ? 'flex' : 'none';
    });

    document.getElementById('toggle-zoom')?.addEventListener('change', (e) => {
      const zoomWidget = document.getElementById('zoom-widget');
      if (zoomWidget) zoomWidget.style.display = e.target.checked ? 'flex' : 'none';
    });

    // Floor Selector Toggle & Outside Click Listener
    const floorSelect = document.getElementById('custom-floor-select');
    const floorBtn = document.getElementById('floor-select-btn');

    if (floorSelect && floorBtn) {
      floorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        floorSelect.classList.toggle('open');
      });

      document.addEventListener('click', () => {
        floorSelect.classList.remove('open');
      });
    }

    // View Mode Switcher (2D / 3D / Reset)
    const btn2D = document.getElementById('btn-view-2d');
    const btn3D = document.getElementById('btn-view-3d');
    const btnReset = document.getElementById('btn-view-reset');

    btn2D?.addEventListener('click', () => {
      btn2D.classList.add('active');
      btn3D?.classList.remove('active');
      if (CameraController && CameraController.set2DView) {
        CameraController.set2DView();
      }
    });

    btn3D?.addEventListener('click', () => {
      btn3D.classList.add('active');
      btn2D?.classList.remove('active');
      if (CameraController && CameraController.set3DView) {
        CameraController.set3DView();
      }
    });

    btnReset?.addEventListener('click', () => {
      if (CameraController && CameraController.resetView) {
        CameraController.resetView();
      }
    });
  }

  return { displayInfo, applyTranslations, startClock, showErrorUI, initEvents, populateFloors };
})();
