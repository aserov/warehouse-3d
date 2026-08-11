window.WH = window.WH || {};
WH.sidebar = WH.sidebar || {};
WH.sidebar.info = WH.sidebar.info || {};

WH.sidebar.info.renderCell = function(userData) {
  const t = WH.utils.t;
  const formatNum = WH.utils.formatNumber;
  const unitVol = WH.sidebar.info.getUnit('volume');
  const unitWeight = WH.sidebar.info.getUnit('weight');
  const unitDim = WH.sidebar.info.getUnit('dimension');

  const cell = userData.data;
  const cellVol = WH.utils.calculateCellVolume(cell.width, cell.height, cell.depth);

  return `
    <div class="info-card type-cell">
      <h3 class="info-card-header">🏷️ ${t('cell')}: ${cell.number}</h3>
      <div class="info-card-subtitle">${t('area')}: <strong>${userData.areaName}</strong> · ${t('row')}: <strong>${userData.rowName}</strong> · ${t('level')}: <strong>${userData.levelName}</strong></div>
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
};