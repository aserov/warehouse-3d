window.Warehouse = window.Warehouse || {};

/**
 * Standalone toolbar clock module.
 * Deliberately separated from uiController.js: this is a small, self-contained
 * "nice to have" widget unrelated to warehouse rendering logic, kept isolated
 * so it can be modified or dropped without touching core UI code.
 */
window.Warehouse.ToolbarClock = (function() {
  let intervalId = null;

  function updateTime() {
    const { CONFIG } = window.Warehouse;
    const clockEl = document.getElementById('toolbar-clock');
    if (!clockEl) return;

    const lang = (CONFIG && CONFIG.defaultLang) || 'en';
    const now = new Date();

    const days = lang === 'ru'
      ? ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const months = lang === 'ru'
      ? ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const dayNum = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();

    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');

    let timeZoneStr = 'Standard Time';
    try {
      const timeZoneMatch = Intl.DateTimeFormat(lang, { timeZoneName: 'long' })
        .formatToParts(now)
        .find(p => p.type === 'timeZoneName');
      if (timeZoneMatch) timeZoneStr = timeZoneMatch.value;
    } catch (e) {}

    clockEl.textContent = `${dayName} ${monthName} ${dayNum} ${year} ${hours}:${mins}:${secs} (${timeZoneStr})`;
  }

  /**
   * Starts the real-time toolbar clock (idempotent - calling twice just restarts the interval).
   */
  function start() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    updateTime();
    intervalId = setInterval(updateTime, 1000);
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  return { start, stop };
})();
