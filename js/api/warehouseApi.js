window.WH = window.WH || {};
WH.api = WH.api || {};

(function() {
  function mockDelay(ms = 2000) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  WH.api.getWarehouses = async function() {
    await mockDelay();

    return {
      ok: true,
      data: WH.apiMock.data,
      error: null,
    };
  };
})();