window.WH = window.WH || {};
WH.utils = WH.utils || {};

const SCALE_FACTOR_BY_MEASUREMENT = {
  Meter: 1,
  Centimeter: 0.01,
  Millimeter: 0.001,
};

WH.utils.getScaleFactor = function(measurement) {
  return SCALE_FACTOR_BY_MEASUREMENT[measurement] ?? 1;
};