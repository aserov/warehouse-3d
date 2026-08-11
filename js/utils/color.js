window.WH = window.WH || {};
WH.utils = WH.utils || {};

WH.utils.toHexColor = function(color) {
  return `#${color.toString(16).padStart(6, '0')}`;
};