window.WH = window.WH || {};
WH.canvas = WH.canvas || {};

WH.canvas.FiltersDropdown = (function() {
  const instances = [];

  function setupDropdown({ wrapperId, btnId, textId, menuId }) {
    const wrapper = document.getElementById(wrapperId);
    const btn = document.getElementById(btnId);
    const text = document.getElementById(textId);
    const menu = document.getElementById(menuId);
    if (!wrapper || !btn || !text || !menu) return null;

    function handleOutsideClick(e) {
      if (!wrapper.contains(e.target)) close();
    }

    function open() {
      closeAllExcept(instance);
      wrapper.classList.add('open');
      document.addEventListener('click', handleOutsideClick);
    }

    function close() {
      wrapper.classList.remove('open');
      document.removeEventListener('click', handleOutsideClick);
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      wrapper.classList.contains('open') ? close() : open();
    });

    function setItems(items, selectedValue, onSelect, renderLabel) {
      menu.innerHTML = '';
      items.forEach((item) => {
        const el = document.createElement('div');
        const isActive = item.value === selectedValue;
        el.className = `floor-option${isActive ? ' active' : ''}`;
        el.setAttribute('data-value', item.value);
        el.textContent = renderLabel(item);
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          close();
          if (!isActive) onSelect(item.value);
        });
        menu.appendChild(el);
      });
    }

    function setText(label) {
      text.textContent = label;
    }

    const instance = { close, setItems, setText };
    instances.push(instance);
    return instance;
  }

  function closeAllExcept(except) {
    instances.forEach((instance) => {
      if (instance !== except) instance.close();
    });
  }

  function closeAll() {
    instances.forEach((instance) => instance.close());
  }

  const warehouseDropdown = setupDropdown({
    wrapperId: 'custom-warehouse-select', btnId: 'warehouse-select-btn',
    textId: 'warehouse-current-text', menuId: 'warehouse-dropdown-menu',
  });
  const floorDropdown = setupDropdown({
    wrapperId: 'custom-floor-select', btnId: 'floor-select-btn',
    textId: 'floor-current-text', menuId: 'floor-dropdown-menu',
  });
  const areaDropdown = setupDropdown({
    wrapperId: 'custom-area-select', btnId: 'area-select-btn',
    textId: 'area-current-text', menuId: 'area-dropdown-menu',
  });

  function render(state) {
    const store = WH.canvas.WarehouseDataStore;

    if (warehouseDropdown) {
      const items = state.warehouses.map(w => ({ value: w.warehouse, label: w.warehouseName || `#${w.warehouse}` }));
      warehouseDropdown.setItems(items, state.selectedWarehouseId, store.selectWarehouse, i => i.label);
      const current = items.find(i => i.value === state.selectedWarehouseId);
      warehouseDropdown.setText(current ? current.label : WH.utils.t('warehouse'));
    }

    if (floorDropdown) {
      const items = state.floors.map(f => ({ value: f, label: `${WH.utils.t('floor')} ${f}` }));
      floorDropdown.setItems(items, state.selectedFloor, store.selectFloor, i => i.label);
      const current = items.find(i => i.value === state.selectedFloor);
      floorDropdown.setText(current ? current.label : WH.utils.t('floor'));
    }

    if (areaDropdown) {
      const items = [
        { value: store.ALL_AREAS, label: WH.utils.t('allAreas') },
        ...state.areasForFloor.map(a => ({ value: a.area, label: `${WH.utils.t('area')} ${a.areaName}` })),
      ];
      areaDropdown.setItems(items, state.selectedArea, store.selectArea, i => i.label);
      const current = items.find(i => i.value === state.selectedArea);
      areaDropdown.setText(current ? current.label : WH.utils.t('allAreas'));
    }
  }

  function init() {
    WH.events.on('warehouseData:change', render);
  }

  return { init, closeAll };
})();