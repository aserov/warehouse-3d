window.WH = window.WH || {};
WH.sidebar = WH.sidebar || {};

WH.sidebar.Accordion = (function() {
  const SIDEBAR_ID = 'sidebar';
  const SECTION_SELECTOR = '.sidebar-section';
  const HEADER_SELECTOR = '.section-title';

  function toggleSection(header) {
    const section = header.closest(SECTION_SELECTOR);
    if (!section) return;

    const isCollapsed = section.classList.toggle('collapsed');
    header.setAttribute('aria-expanded', String(!isCollapsed));
  }

  function handleClick(e) {
    const header = e.target.closest(HEADER_SELECTOR);
    if (header) toggleSection(header);
  }

  function handleKeydown(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const header = e.target.closest(HEADER_SELECTOR);
    if (!header) return;

    e.preventDefault();
    toggleSection(header);
  }

  function setupAccessibility() {
    document.querySelectorAll(`${SECTION_SELECTOR} ${HEADER_SELECTOR}`).forEach(header => {
      header.setAttribute('role', 'button');
      header.setAttribute('tabindex', '0');
      const section = header.closest(SECTION_SELECTOR);
      header.setAttribute('aria-expanded', String(!section.classList.contains('collapsed')));
    });
  }

  function init() {
    const sidebar = document.getElementById(SIDEBAR_ID);
    if (!sidebar) return;

    setupAccessibility();
    sidebar.addEventListener('click', handleClick);
    sidebar.addEventListener('keydown', handleKeydown);
  }

  return { init };
})();