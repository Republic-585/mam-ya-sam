
(function () {
  const header = document.querySelector('.topbar');
  const skill = document.getElementById('skill');
  const wordmark = header && header.querySelector('.logo__text');
  const cube = header && header.querySelector('.logo__dot');
  if (!header || !skill || !wordmark || !cube || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;
  function measureWordmarkTarget() {
    header.style.setProperty('--wordmark-scroll-progress', '0');
    const wordRect = wordmark.getBoundingClientRect();
    const cubeRect = cube.getBoundingClientRect();
    /* Траектория текста заканчивается на кубике; невидимая надпись не занимает место. */
    header.style.setProperty('--wordmark-into-x', (cubeRect.right - wordRect.left).toFixed(2) + 'px');
    header.style.setProperty('--wordmark-into-y', (cubeRect.top + cubeRect.height / 2 - wordRect.top - wordRect.height / 2).toFixed(2) + 'px');
  }
  function updateWordmark() {
    const headerHeight = header.getBoundingClientRect().height;
    const skillTop = skill.getBoundingClientRect().top;
    const travelDistance = Math.max(1, window.innerHeight - headerHeight);
    const progress = Math.min(1, Math.max(0, (window.innerHeight - skillTop) / travelDistance));
    header.style.setProperty('--wordmark-scroll-progress', progress.toFixed(4));
    /* После завершения растворения скрываем сам слой текста: это убирает остаточный след композитинга на iOS при прокрутке вниз. */
    wordmark.style.setProperty('visibility', progress >= 0.49 ? 'hidden' : 'visible', 'important');
    ticking = false;
  }
  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateWordmark);
  }
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', function () {
    measureWordmarkTarget();
    requestUpdate();
  }, { passive: true });
  measureWordmarkTarget();
  updateWordmark();
})();
