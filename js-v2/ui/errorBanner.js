window.WH = window.WH || {};
WH.ui = WH.ui || {};

WH.ui.ErrorBanner = (function() {
  function show(title, details) {
    let errorBox = document.getElementById('error-banner');
    if (!errorBox) {
      errorBox = document.createElement('div');
      errorBox.id = 'error-banner';
      document.body.appendChild(errorBox);
    }

    errorBox.innerHTML = `
      <div class="error-content">
        <div class="error-header"><strong>${title}</strong></div>
        <p>${details}</p>
        <button type="button" id="error-banner-retry">${WH.utils.t('retryBtn')}</button>
      </div>`;
    errorBox.classList.add('visible');

    document.getElementById('error-banner-retry')
      ?.addEventListener('click', () => location.reload(), { once: true });
  }

  function hide() {
    document.getElementById('error-banner')?.classList.remove('visible');
  }

  return { show, hide };
})();