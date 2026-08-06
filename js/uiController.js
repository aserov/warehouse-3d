window.Warehouse = window.Warehouse || {};

window.Warehouse.UIController = (function() {
  const { CONFIG, Utils, Builder, CameraController } = window.Warehouse;

  /**
   * Helper fallback to handle missing Utils gracefully if undefined.
   */
  const t = (key) => (Utils && Utils.t ? Utils.t(key) : key);
  const getUnit = (type) => (Utils && Utils.getUnit ? Utils.getUnit(type) : '');
  const formatNum = (num, decimals) => (Utils && Utils.formatNumber ? Utils.formatNumber(num, decimals) : num);

  /**
   * Renders details card in sidebar when an object (area, row, cell) is selected.
   * @param {Object} userData - Metadata associated with the clicked 3D mesh.
   */
  function displayInfo(userData) {
    const infoContent = document.getElementById('info-content');
    if (!infoContent || !userData || !userData.type) return;

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
            <div>${t('totalVolume')}: <strong>${formatNum(userData.totalVolume)} ${unitVol}</strong></div>
            <div>${t('totalMaxWeight')}: <strong>${formatNum(userData.totalWeight)} ${unitWeight}</strong></div>
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
            <div>${t('totalVolume')}: <strong>${formatNum(userData.totalVolume)} ${unitVol}</strong></div>
            <div>${t('totalMaxWeight')}: <strong>${formatNum(userData.totalWeight)} ${unitWeight}</strong></div>
          </div>
          <div class="info-badge-list">
            <div class="info-badge-item active"><span>${t('activeCells')}</span><span class="badge-tag">${userData.activeCells}</span></div>
            <div class="info-badge-item ${userData.inactiveCells > 0 ? 'inactive' : 'neutral'}"><span>${t('inactiveCells')}</span><span class="badge-tag">${userData.inactiveCells}</span></div>
          </div>
        </div>`;
    } else if (userData.type === 'cell') {
      const cell = userData.data;
      const cellVol = Utils && Utils.calculateCellVolume ? Utils.calculateCellVolume(cell.width, cell.height, cell.depth) : 0;
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
            <div>${t('totalVolume')}: <strong>${formatNum(cellVol, 2)} ${unitVol}</strong></div>
            <div>${t('totalMaxWeight')}: <strong>${formatNum(cell.weight, 0)} ${unitWeight}</strong></div>
            <div>${t('totalFreeWeight')}: <strong>${formatNum(cell.freeWeight, 0)} ${unitWeight}</strong></div>
            <div>${t('dimensions')}: <strong>${cell.width}×${cell.height}×${cell.depth} ${unitDim}</strong></div>
          </div>
        </div>`;
    }
  }

  /**
   * Applies active language translations to elements with data-i18n attribute.
   */
  function applyTranslations() {
    if (!window.Warehouse || !window.Warehouse.i18n) return;

    const currentLang = (CONFIG && CONFIG.defaultLang) || 'en';
    const dictionary = window.Warehouse.i18n[currentLang] || window.Warehouse.i18n.en;

    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translatedText = dictionary ? dictionary[key] : null;

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
      const lang = (CONFIG && CONFIG.defaultLang) || 'en';
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

      let timeZoneStr = 'Standard Time';
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
   * Closes all active custom dropdown popups (floors, areas, search results).
   */
  function closeAllDropdowns() {
    document.getElementById('custom-floor-select')?.classList.remove('open');
    document.getElementById('custom-area-select')?.classList.remove('open');
    document.getElementById('search-dropdown-menu')?.classList.remove('open');
  }

  /**
   * Dynamically populates floor selector dropdown items.
   * @param {Array<number|string>} floors - List of available floor numbers.
   * @param {number|string} activeFloor - Currently selected floor.
   * @param {Function} onFloorChange - Callback invoked when a floor is clicked.
   */
  function populateFloors(floors, activeFloor, onFloorChange) {
    const floorMenu = document.getElementById('floor-dropdown-menu');
    const currentText = document.getElementById('floor-current-text');
    if (!floorMenu || !currentText) return;

    floorMenu.innerHTML = '';

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
        closeAllDropdowns();

        if (typeof onFloorChange === 'function') {
          onFloorChange(floor);
        }
      });

      floorMenu.appendChild(item);
    });

    currentText.textContent = `${floorPrefix} ${activeFloor}`;
  }

  /**
   * Dynamically populates area/zone selector dropdown items.
   * @param {Array<Object>} areas - List of area items for current floor.
   * @param {string} activeArea - Currently selected area name ('all' or areaName).
   * @param {Function} onAreaChange - Callback invoked when an area is selected.
   */
  function populateAreas(areas, activeArea, onAreaChange) {
    const areaMenu = document.getElementById('area-dropdown-menu');
    const currentText = document.getElementById('area-current-text');
    if (!areaMenu || !currentText) return;

    areaMenu.innerHTML = '';

    const lang = (CONFIG && CONFIG.defaultLang) || 'ru';
    const allAreasText = lang === 'ru' ? 'Все зоны' : 'All Areas';
    const areaPrefix = lang === 'ru' ? 'Зона' : 'Area';

    // Default "All Areas" option
    const allOption = document.createElement('div');
    allOption.className = `floor-option ${activeArea === 'all' || !activeArea ? 'active' : ''}`;
    allOption.setAttribute('data-value', 'all');
    allOption.textContent = allAreasText;

    allOption.addEventListener('click', (e) => {
      e.stopPropagation();
      areaMenu.querySelectorAll('.floor-option').forEach(opt => opt.classList.remove('active'));
      allOption.classList.add('active');
      currentText.textContent = allAreasText;
      closeAllDropdowns();

      if (typeof onAreaChange === 'function') {
        onAreaChange('all');
      }
    });

    areaMenu.appendChild(allOption);

    // Add dynamic areas
    if (areas && Array.isArray(areas)) {
      areas.forEach(area => {
        const areaName = area.areaName || area;
        const item = document.createElement('div');
        item.className = `floor-option ${activeArea === areaName ? 'active' : ''}`;
        item.setAttribute('data-value', areaName);
        item.textContent = `${areaPrefix} ${areaName}`;

        item.addEventListener('click', (e) => {
          e.stopPropagation();
          areaMenu.querySelectorAll('.floor-option').forEach(opt => opt.classList.remove('active'));
          item.classList.add('active');
          currentText.textContent = `${areaPrefix} ${areaName}`;
          closeAllDropdowns();

          if (typeof onAreaChange === 'function') {
            onAreaChange(areaName);
          }
        });

        areaMenu.appendChild(item);
      });
    }

    currentText.textContent = (activeArea === 'all' || !activeArea) ? allAreasText : `${areaPrefix} ${areaName}`;
  }

  /**
   * Triggers standard application object selection logic via Warehouse.Selection
   */
  function triggerStandardSelection(mesh) {
    if (!mesh) return;

    const Selection = window.Warehouse && window.Warehouse.Selection;
    if (Selection && typeof Selection.select === 'function') {
      Selection.select(mesh);
    }
  }

  /**
   * Initializes Cell Search input and dropdown autocompletion logic.
   */
  function initCellSearch() {
    const searchInput = document.getElementById('cell-search-input');
    const searchDropdown = document.getElementById('search-dropdown-menu');
    const clearBtn = document.getElementById('search-clear-btn');

    if (!searchInput || !searchDropdown) return;

    const performSearch = () => {
      const query = searchInput.value.trim().toLowerCase();

      if (clearBtn) {
        clearBtn.style.display = query.length > 0 ? 'block' : 'none';
      }

      if (!query) {
        searchDropdown.classList.remove('open');
        searchDropdown.innerHTML = '';
        return;
      }

      // Filter cell objects from Builder interactive items
      const interactive = (Builder && Builder.interactiveObjects) ? Builder.interactiveObjects : [];
      const matchingCells = interactive.filter(obj => {
        if (!obj || !obj.userData || obj.userData.type !== 'cell') return false;

        const userData = obj.userData;
        const cell = userData.data || {};

        const searchableText = [
          cell.number,
          cell.place,
          userData.cellNumber,
          userData.areaName,
          userData.rowName,
          userData.levelName
        ].filter(Boolean).join(' ').toLowerCase();

        return searchableText.includes(query);
      });

      searchDropdown.innerHTML = '';

      if (matchingCells.length === 0) {
        const noResult = document.createElement('div');
        noResult.className = 'search-item';
        noResult.style.cursor = 'default';
        noResult.style.color = '#64748b';
        noResult.textContent = t('noResults');
        searchDropdown.appendChild(noResult);
      } else {
        matchingCells.slice(0, 20).forEach(mesh => {
          const userData = mesh.userData;
          const cell = userData.data || {};
          const cellTitle = cell.number || userData.cellNumber || '';

          const item = document.createElement('div');
          item.className = 'search-item';
          item.innerHTML = `
            <span><strong>${cellTitle}</strong></span>
            <span class="search-item-sub">${userData.areaName || ''} / ${userData.rowName || ''}</span>
          `;

          item.addEventListener('click', (e) => {
            e.stopPropagation();

            // 1. Populate input text with chosen cell code
            if (cellTitle) {
              searchInput.value = cellTitle;
            }

            // 2. Trigger standard selection logic (highlights mesh with standard selection material)
            triggerStandardSelection(mesh);

            // 3. Focus camera with comfortable padding distance
            if (typeof THREE !== 'undefined' && mesh) {
              const box = new THREE.Box3().setFromObject(mesh);
              const paddedBox = box.clone().expandByScalar(25);

              const SceneSetupRef = (window.Warehouse && window.Warehouse.SceneSetup) || (typeof SceneSetup !== 'undefined' ? SceneSetup : null);
              const CameraControllerRef = (window.Warehouse && window.Warehouse.CameraController) || (typeof CameraController !== 'undefined' ? CameraController : null);

              if (SceneSetupRef && typeof SceneSetupRef.focusOnBounds === 'function') {
                SceneSetupRef.focusOnBounds(paddedBox);
              } else if (CameraControllerRef) {
                if (typeof CameraControllerRef.focusOnBounds === 'function') {
                  CameraControllerRef.focusOnBounds(paddedBox);
                } else if (typeof CameraControllerRef.focusOnObject === 'function') {
                  CameraControllerRef.focusOnObject(mesh);
                }
              }
            }

            closeAllDropdowns();
          });

          searchDropdown.appendChild(item);
        });
      }

      searchDropdown.classList.add('open');
    };

    searchInput.addEventListener('input', performSearch);
    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim().length > 0) {
        performSearch();
      }
    });

    clearBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      searchInput.value = '';
      clearBtn.style.display = 'none';
      searchDropdown.classList.remove('open');
      searchDropdown.innerHTML = '';
      if (window.Warehouse && window.Warehouse.Selection) {
        window.Warehouse.Selection.clear();
      }
      searchInput.focus();
    });
  }

  /**
   * Binds UI control events (toggles, camera views, custom dropdown listeners, cell search).
   */
  function initEvents() {
    // 3D Scene Label Toggles
    document.getElementById('toggle-area-labels')?.addEventListener('change', (e) => {
      if (Builder && Builder.areaLabels) Builder.areaLabels.forEach(mesh => mesh.visible = e.target.checked);
    });

    document.getElementById('toggle-row-labels')?.addEventListener('change', (e) => {
      if (Builder && Builder.rowLabels) Builder.rowLabels.forEach(mesh => mesh.visible = e.target.checked);
    });

    document.getElementById('toggle-level-labels')?.addEventListener('change', (e) => {
      if (Builder && Builder.levelLabels) Builder.levelLabels.forEach(mesh => mesh.visible = e.target.checked);
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

    // Custom Floor Dropdown Toggle
    const floorSelect = document.getElementById('custom-floor-select');
    const floorBtn = document.getElementById('floor-select-btn');

    if (floorSelect && floorBtn) {
      floorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = floorSelect.classList.contains('open');
        closeAllDropdowns();
        if (!isOpen) floorSelect.classList.add('open');
      });
    }

    // Custom Area Dropdown Toggle
    const areaSelect = document.getElementById('custom-area-select');
    const areaBtn = document.getElementById('area-select-btn');

    if (areaSelect && areaBtn) {
      areaBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = areaSelect.classList.contains('open');
        closeAllDropdowns();
        if (!isOpen) areaSelect.classList.add('open');
      });
    }

    // Global listener to close dropdowns when clicking outside
    document.addEventListener('click', () => {
      closeAllDropdowns();
    });

    // Initialize Cell Search Handlers
    initCellSearch();

    // View Mode Switcher (2D / 3D / Reset)
    const btn2D = document.getElementById('btn-2d');
    const btn3D = document.getElementById('btn-3d');
    const btnReset = document.getElementById('btn-reset-view');

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
      closeAllDropdowns();

      // Clear search input
      const searchInput = document.getElementById('cell-search-input');
      const clearBtn = document.getElementById('search-clear-btn');
      if (searchInput) searchInput.value = '';
      if (clearBtn) clearBtn.style.display = 'none';

      // 1. Clear selection highlight & reset sidebar info
      if (window.Warehouse && window.Warehouse.Selection) {
        window.Warehouse.Selection.clear();
      }

      // 2. Reset UI text and zone list
      const lang = (CONFIG && CONFIG.defaultLang) || 'ru';
      const currentAreaText = document.getElementById('area-current-text');
      if (currentAreaText) currentAreaText.textContent = t('allAreas');

      const areaMenu = document.getElementById('area-dropdown-menu');
      if (areaMenu) {
        areaMenu.querySelectorAll('.floor-option').forEach(opt => {
          opt.classList.toggle('active', opt.getAttribute('data-value') === 'all');
        });
      }

      // 3. Reset highlight/opacity of elements
      if (Builder && typeof Builder.setFocusedArea === 'function') {
        Builder.setFocusedArea(null);
      }

      // 4. Reset camera position
      if (CameraController && typeof CameraController.resetView === 'function') {
        CameraController.resetView();
      }
    });
  }

  return { displayInfo, applyTranslations, startClock, showErrorUI, initEvents, populateFloors, populateAreas, closeAllDropdowns };
})();
