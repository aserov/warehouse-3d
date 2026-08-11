window.WH = window.WH || {};
WH.sidebar = WH.sidebar || {};
WH.sidebar.info = WH.sidebar.info || {};

WH.sidebar.info.renderFloor = function(userData) {
  const t = WH.utils.t;
  const formatNum = WH.utils.formatNumber;
  const utilizationPct = WH.utils.formatUtilizationPct;
  const unitVol = WH.sidebar.info.getUnit('volume');
  const unitWeight = WH.sidebar.info.getUnit('weight');
  const unitArea = WH.sidebar.info.getUnit('area');

  return `
    <div class="info-card type-floor">
      <h3 class="info-card-header">🏢 ${t('warehouse')}: ${userData.warehouseName}</h3>
      <div class="info-card-subtitle">${t('floor')}: <strong>${userData.floor}</strong></div>
      <hr class="info-card-divider">
      <div class="info-card-list">
        <div>${t('totalAreas')}: <strong>${userData.totalAreas}</strong></div>
        <div>${t('totalRows')}: <strong>${userData.totalRows}</strong></div>
        <div>${t('totalCells')}: <strong>${userData.totalCells}</strong></div>
        <div>${t('totalVolume')}: <strong>${formatNum(userData.totalVolume)} ${unitVol}</strong></div>
        <div>${t('totalMaxWeight')}: <strong>${formatNum(userData.totalWeight)} ${unitWeight}</strong></div>
        <div>${t('totalFreeWeight')}: <strong>${formatNum(userData.totalFreeWeight)} ${unitWeight}</strong></div>
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