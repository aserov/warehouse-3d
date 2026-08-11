window.WH = window.WH || {};
WH.sidebar = WH.sidebar || {};
WH.sidebar.info = WH.sidebar.info || {};

WH.sidebar.info.renderLevel = function(userData) {
  const t = WH.utils.t;
  const formatNum = WH.utils.formatNumber;
  const unitVol = WH.sidebar.info.getUnit('volume');
  const unitWeight = WH.sidebar.info.getUnit('weight');
  const unitArea = WH.sidebar.info.getUnit('area');

  return `
    <div class="info-card type-level">
      <h3 class="info-card-header">🧱 ${t('level')}: ${userData.levelName}</h3>
      <div class="info-card-subtitle">${t('floor')}: <strong>${userData.floor}</strong> · ${t('area')}: <strong>${userData.areaName}</strong> · ${t('row')}: <strong>${userData.rowName}</strong></div>
      <hr class="info-card-divider">
      <div class="info-card-list">
        <div>${t('totalCells')}: <strong>${userData.totalCells}</strong></div>
        <div>${t('totalVolume')}: <strong>${formatNum(userData.totalVolume)} ${unitVol}</strong></div>
        <div>${t('totalMaxWeight')}: <strong>${formatNum(userData.totalWeight)} ${unitWeight}</strong></div>
        <div>${t('totalFreeWeight')}: <strong>${formatNum(userData.totalFreeWeight)} ${unitWeight}</strong></div>
        <div>${t('polygonArea')}: <strong>${formatNum(userData.footprint)} ${unitArea}</strong></div>
        <div>${t('direction')}: <strong>${userData.direction}</strong></div>
        <div>${t('orientation')}: <strong>${userData.orientation}</strong></div>
      </div>
      <div class="info-badge-list">
        <div class="info-badge-item active"><span>${t('activeCells')}</span><span class="badge-tag">${userData.activeCells}</span></div>
        <div class="info-badge-item ${userData.inactiveCells > 0 ? 'inactive' : 'neutral'}"><span>${t('inactiveCells')}</span><span class="badge-tag">${userData.inactiveCells}</span></div>
      </div>
    </div>`;
};