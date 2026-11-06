/* Первое открытие начинается с первого экрана; перезагрузка сохраняет позицию прокрутки. */
(function () {
  let savedScrollY = 0;
  let isReload = false;
  try {
    const navigation = performance.getEntriesByType('navigation')[0];
    isReload = !!navigation && navigation.type === 'reload';
    if (isReload) savedScrollY = Number(sessionStorage.getItem('mamYaSamScrollY') || 0);
    else sessionStorage.removeItem('mamYaSamScrollY');
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  } catch (_) {}

  if (!isReload) {
    if (location.hash) {
      history.replaceState(null, '', location.pathname + location.search);
    }
    window.scrollTo(0, 0);
  } else {
    window.addEventListener('load', function () {
      requestAnimationFrame(function () {
        window.scrollTo(0, savedScrollY);
        requestAnimationFrame(function () { window.scrollTo(0, savedScrollY); });
      });
    }, { once: true });
  }

  window.addEventListener('pagehide', function () {
    try { sessionStorage.setItem('mamYaSamScrollY', String(window.scrollY)); } catch (_) {}
  });
})();
