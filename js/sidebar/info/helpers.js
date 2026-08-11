window.WH = window.WH || {};
WH.sidebar = WH.sidebar || {};
WH.sidebar.info = WH.sidebar.info || {};

WH.sidebar.info.getUnit = function(key) {
  const lang = (WH.config && WH.config.defaultLang) || 'en';
  const dict = (WH.i18n && WH.i18n[lang]) || (WH.i18n && WH.i18n.en) || {};
  return (dict.units && dict.units[key]) || '';
};