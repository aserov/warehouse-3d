window.WH = window.WH || {};

WH.ToolbarClock = (function() {
  let intervalId = null;

  function updateTime() {
    const clockEl = document.getElementById('toolbar-clock');
    if (!clockEl) return;

    const lang = (WH.config && WH.config.defaultLang) || 'en';
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