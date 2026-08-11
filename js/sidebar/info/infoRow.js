window.WH = window.WH || {};
WH.sidebar = WH.sidebar || {};
WH.sidebar.info = WH.sidebar.info || {};

WH.sidebar.info.renderRow = function(userData) {
  const t = WH.utils.t;
  const formatNum = WH.utils.formatNumber;
  const utilizationPct = WH.utils.formatUtilizationPct;
  const unitVol = WH.sidebar.info.getUnit('volume');
  const unitWeight = WH.sidebar.info.getUnit('weight');
  const unitArea = WH.sidebar.info.getUnit('area');

  return `
    <div class="info-card type-row">
      <h3 class="info-card-header">📊 ${t('row')}: ${userData.rowName}</h3>
      <div class="info-card-subtitle">${t('warehouse')}: <strong>${userData.warehouseName}</strong> · ${t('floor')}: <strong>${userData.floor}</strong> · ${t('area')}: <strong>${userData.areaName}</strong></div>
      <hr class="info-card-divider">
      <div class="info-card-list">
        <div>${t('totalLevels')}: <strong>${userData.totalLevels}</strong></div>
        <div>${t('totalCells')}: <strong>${userData.totalCells}</strong></div>
        <div>${t('totalVolume')}: <strong>${formatNum(userData.totalVolume)} ${unitVol}</strong></div>
        <div>${t('totalMaxWeight')}: <strong>${formatNum(userData.totalWeight)} ${unitWeight}</strong></div>
        <div>${t('direction')}: <strong>${userData.direction}</strong></div>
        <div>${t('polygonArea')}: <strong>${formatNum(userData.polygonArea)} ${unitArea}</strong></div>
        <div>${t('usedArea')}: <strong>${formatNum(userData.usedArea)} ${unitArea}</strong></div>
        <div>${t('utilization')}: <strong>${utilizationPct(userData.usedArea, userData.polygonArea)}%</strong></div>
      </div>
      <div class="info-badge-list">
        <div class="info-badge-item active"><span>${t('activeCells')}</span><span class="badge-tag">${userData.activeCells}</span></div>
        <div class="info-badge-item ${userData.inactiveCells > 0 ? 'inactive' : 'neutral'}"><span>${t('inactiveCells')}</span><span class="badge-tag">${userData.inactiveCells}</span></div>
      </div>
    </div>`;
};