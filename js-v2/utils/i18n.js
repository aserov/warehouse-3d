window.WH = window.WH || {};
WH.utils = WH.utils || {};

WH.utils.t = function(key) {
  const lang = (WH.config && WH.config.defaultLang) || 'ru';
  const dict = (WH.i18n && WH.i18n[lang]) || (WH.i18n && WH.i18n['ru']) || {};
  return dict[key] || key;
};