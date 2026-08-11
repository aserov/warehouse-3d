window.WH = window.WH || {};
WH.utils = WH.utils || {};

WH.utils.t = function(key) {
  const lang = (WH.config && WH.config.defaultLang) || 'ru';
  const dict = (WH.i18n && WH.i18n[lang]) || (WH.i18n && WH.i18n['ru']) || {};
  return dict[key] || key;
};

WH.utils.applyTranslations = function() {
  if (!WH.i18n) return;

  const lang = (WH.config && WH.config.defaultLang) || 'en';
  const dictionary = WH.i18n[lang] || WH.i18n.en;
  if (!dictionary) return;

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.getAttribute('data-i18n');
    const translatedText = dictionary[key];
    if (!translatedText) return;

    const input = element.querySelector('input');
    if (input) {
      element.textContent = ' ' + translatedText;
      element.prepend(input);
    } else {
      element.textContent = translatedText;
    }
  });
};