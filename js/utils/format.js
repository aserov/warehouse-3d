window.WH = window.WH || {};
WH.utils = WH.utils || {};

WH.utils.formatNumber = function(value, decimals = 0) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: decimals });
};

WH.utils.formatUtilizationPct = function(used, total) {
  return total > 0 ? WH.utils.formatNumber((used / total) * 100, 1) : '0';
};