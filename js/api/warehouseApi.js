window.WH = window.WH || {};
WH.api = WH.api || {};

(function() {
  const ERROR_RATE = 0.3;

  function mockDelay(ms = 1000) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  WH.api.getWarehouses = async function() {
    await mockDelay();

    if (Math.random() < ERROR_RATE) {
      return {
        ok: false,
        data: null,
        error: 'Something went wrong...',
      };
    }

    return {
      ok: true,
      data: WH.apiMock.data,
      error: null,
    };
  };
})();