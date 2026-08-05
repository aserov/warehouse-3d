window.Warehouse = window.Warehouse || {};

window.Warehouse.UIController = (function() {
  const { CONFIG, Utils, Builder } = window.Warehouse;
  const infoContent = document.getElementById('info-content');
  const infoPanel = document.getElementById('info-panel');
  const toggleInfoCheckbox = document.getElementById('toggle-info-panel');
  const closeInfoBtn = document.getElementById('close-info-panel');

  function displayInfo(userData) {
    if (!userData || !userData.type) return;

    if (!toggleInfoCheckbox.checked) {
      toggleInfoCheckbox.checked = true;
      toggleInfoCheckbox.dispatchEvent(new Event('change'));
    }

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

  function applyTranslations() {
    const currentLang = CONFIG.defaultLang || 'en';
    const t = window.Warehouse.i18n[currentLang] || window.Warehouse.i18n.en;

    const toggleBtnText = document.getElementById('toggle2DBtnText');
    if (toggleBtnText) toggleBtnText.textContent = t.toggleView;

    ['row-labels', 'level-labels', 'info-panel'].forEach(id => {
      const label = document.querySelector(`#toggle-${id}`)?.parentElement;
      if (label) {
        const input = label.querySelector('input');
        const key = id === 'row-labels' ? 'showRowLabels' : id === 'level-labels' ? 'showLevelLabels' : 'showInfoPanel';
        label.textContent = ' ' + t[key];
        label.prepend(input);
      }
    });

    const infoTitle = document.querySelector('#info-panel h3');
    if (infoTitle) infoTitle.textContent = t.infoTitle;

    if (infoContent && !infoContent.dataset.custom) {
      infoContent.textContent = t.defaultInfoText;
    }
  }

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

  function initEvents() {
    toggleInfoCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        infoPanel.style.display = 'block';
        setTimeout(() => { infoPanel.style.opacity = '1'; infoPanel.style.transform = 'translateX(0)'; }, 10);
      } else {
        infoPanel.style.opacity = '0';
        infoPanel.style.transform = 'translateX(20px)';
        setTimeout(() => { infoPanel.style.display = 'none'; }, 300);
      }
    });

    closeInfoBtn.addEventListener('click', () => {
      toggleInfoCheckbox.checked = false;
      toggleInfoCheckbox.dispatchEvent(new Event('change'));
    });

    document.getElementById('toggle-row-labels').addEventListener('change', (e) => {
      Builder.rowLabels.forEach(mesh => mesh.visible = e.target.checked);
    });

    document.getElementById('toggle-level-labels').addEventListener('change', (e) => {
      Builder.levelLabels.forEach(mesh => mesh.visible = e.target.checked);
    });
  }

  return { displayInfo, applyTranslations, showErrorUI, initEvents };
})();