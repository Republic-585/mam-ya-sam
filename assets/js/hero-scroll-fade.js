
(function () {
  const hero = document.querySelector('.hero');
  const pill = hero && hero.querySelector('.hero__word-pill');
  if (!hero || !pill || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;

  function measurePillCenter() {
    hero.style.setProperty('--hero-pill-scale', '0');
    hero.style.setProperty('--hero-pill-move', '0');
    const rect = pill.getBoundingClientRect();
    hero.style.setProperty('--hero-pill-center-x', (rect.left + rect.width / 2).toFixed(2) + 'px');
  }

  function updateHeroPill() {
    const distance = Math.max(1, window.innerHeight * 0.58);
    const progress = Math.min(1, Math.max(0, window.scrollY / distance));
    const moveDistance = Math.max(1, window.innerHeight * (0.50 / 1.17));
    const moveProgress = Math.min(1, Math.max(0, window.scrollY / moveDistance));
    hero.style.setProperty('--hero-pill-scale', progress.toFixed(4));
    hero.style.setProperty('--hero-pill-move', moveProgress.toFixed(4));
    ticking = false;
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateHeroPill);
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', function () {
    measurePillCenter();
    requestUpdate();
  }, { passive: true });
  measurePillCenter();
  updateHeroPill();
})();
