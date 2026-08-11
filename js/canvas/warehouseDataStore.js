window.WH = window.WH || {};
WH.canvas = WH.canvas || {};

WH.canvas.WarehouseDataStore = (function() {
  const ALL_AREAS = 'all';

  let state = {
    loading: true,
    error: null,
    warehouses: [],
    selectedWarehouseId: null,
    selectedFloor: null,
    selectedArea: ALL_AREAS,
  };

  function getUniqueFloors(warehouse) {
    const floors = [...new Set(
      warehouse.areas.map(a => Number(a.floor)).filter(f => !Number.isNaN(f))
    )];
    return floors.sort((a, b) => a - b);
  }

  function getCurrentWarehouse() {
    return state.warehouses.find(w => w.warehouse === state.selectedWarehouseId) || null;
  }

  function getFloors() {
    const warehouse = getCurrentWarehouse();
    return warehouse ? getUniqueFloors(warehouse) : [];
  }

  function getAreasForFloor() {
    const warehouse = getCurrentWarehouse();
    if (!warehouse) return [];
    return warehouse.areas.filter(a => Number(a.floor) === state.selectedFloor);
  }

  function getState() {
    return {
      ...state,
      currentWarehouse: getCurrentWarehouse(),
      floors: getFloors(),
      areasForFloor: getAreasForFloor(),
    };
  }

  function emitChange() {
    WH.events.emit('warehouseData:change', getState());
  }

  async function load() {
    state = { ...state, loading: true, error: null };
    emitChange();

    const result = await WH.api.getWarehouses();

    if (!result.ok || !result.data) {
      state = { ...state, error: result.error || 'Failed to load warehouses', loading: false };
      emitChange();
      return;
    }

    const loadedWarehouses = result.data.warehouses;
    const firstWarehouse = loadedWarehouses[0];

    state = {
      ...state,
      warehouses: loadedWarehouses,
      loading: false,
      selectedWarehouseId: firstWarehouse ? firstWarehouse.warehouse : null,
      selectedFloor: firstWarehouse ? (getUniqueFloors(firstWarehouse)[0] ?? null) : null,
      selectedArea: ALL_AREAS,
    };
    emitChange();
  }

  function selectWarehouse(warehouseId) {
    const warehouse = state.warehouses.find(w => w.warehouse === warehouseId);
    if (!warehouse) return;

    state = {
      ...state,
      selectedWarehouseId: warehouseId,
      selectedFloor: getUniqueFloors(warehouse)[0] ?? null,
      selectedArea: ALL_AREAS,
    };
    emitChange();
  }

  function selectFloor(floor) {
    state = { ...state, selectedFloor: floor, selectedArea: ALL_AREAS };
    emitChange();
  }

  function selectArea(area) {
    state = { ...state, selectedArea: area };
    emitChange();
  }

  return { ALL_AREAS, load, getState, selectWarehouse, selectFloor, selectArea };
})();