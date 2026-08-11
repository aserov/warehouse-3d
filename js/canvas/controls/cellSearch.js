window.WH = window.WH || {};
WH.canvas = WH.canvas || {};

WH.canvas.CellSearch = (function() {
  const MAX_RESULTS = 8;
  let areasForFloor = [];

  function buildIndex() {
    const entries = [];
    areasForFloor.forEach((area) => {
      area.rows.forEach((row) => {
        row.levels.forEach((level) => {
          level.cells.forEach((cell) => {
            entries.push({ number: cell.number, areaName: area.areaName, rowName: row.rowName });
          });
        });
      });
    });
    return entries;
  }

  function render(query) {
    const menu = document.getElementById('search-dropdown-menu');
    if (!menu) return;
    menu.innerHTML = '';

    const normalized = query.trim().toLowerCase();
    if (!normalized) return;

    const matches = buildIndex()
      .filter((e) => e.number.toLowerCase().includes(normalized))
      .slice(0, MAX_RESULTS);

    if (matches.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'search-item';
      empty.textContent = WH.utils.t('noResults');
      menu.appendChild(empty);
      return;
    }

    matches.forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'search-item';
      item.innerHTML = `<strong>${entry.number}</strong><span class="search-item-sub">${entry.areaName} / ${entry.rowName}</span>`;
      item.addEventListener('click', () => selectEntry(entry));
      menu.appendChild(item);
    });
  }

  function selectEntry(entry) {
    const input = document.getElementById('cell-search-input');
    if (input) input.value = entry.number;
    close();
    WH.webgl.SceneController.focusAndSelectCell(entry.number);
  }

  function open() {
    document.getElementById('search-dropdown-menu')?.classList.add('open');
  }

  function close() {
    document.getElementById('search-dropdown-menu')?.classList.remove('open');
  }

  function handleOutsideClick(e) {
    const widget = document.getElementById('cell-search-widget');
    if (widget && !widget.contains(e.target)) close();
  }

  function reset() {
    const input = document.getElementById('cell-search-input');
    const clearBtn = document.getElementById('search-clear-btn');
    if (input) input.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    close();
  }

  function init() {
    const input = document.getElementById('cell-search-input');
    const clearBtn = document.getElementById('search-clear-btn');
    if (!input) return;

    input.addEventListener('input', (e) => {
      const value = e.target.value;
      if (clearBtn) clearBtn.style.display = value.length > 0 ? '' : 'none';
      render(value);
      value.trim().length > 0 ? open() : close();
    });

    input.addEventListener('focus', () => {
      if (input.value.trim().length > 0) open();
    });

    clearBtn?.addEventListener('click', reset);

    document.addEventListener('click', handleOutsideClick);

    WH.events.on('warehouseData:change', (state) => {
      areasForFloor = state.areasForFloor || [];
    });
  }

  return { init, reset };
})();