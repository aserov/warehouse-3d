window.WH = window.WH || {};
WH.utils = WH.utils || {};

WH.utils.createEventBus = function() {
  const listeners = {};

  return {
    on(event, handler) {
      (listeners[event] = listeners[event] || []).push(handler);
      return () => this.off(event, handler);
    },
    off(event, handler) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter(h => h !== handler);
    },
    emit(event, payload) {
      (listeners[event] || []).forEach(h => h(payload));
    },
  };
};

WH.events = WH.utils.createEventBus();