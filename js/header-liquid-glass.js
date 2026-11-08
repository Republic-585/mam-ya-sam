/* Subtle Liquid Glass response for the unified site header. */
(function () {
  const header = document.querySelector('header.topbar');
  if (!header) return;

  const pressTargets = header.querySelectorAll('.logo, #heroMenuTrigger');
  let releaseTimer = 0;

  function releasePress() {
    window.clearTimeout(releaseTimer);
    releaseTimer = window.setTimeout(function () {
      header.style.setProperty('--header-glass-press', '0');
    }, 110);
  }

  function pressHeader() {
    window.clearTimeout(releaseTimer);
    header.style.setProperty('--header-glass-press', '0.014');
    releasePress();
  }

  pressTargets.forEach(function (target) {
    target.addEventListener('pointerdown', pressHeader, { passive: true });
    target.addEventListener('click', pressHeader);
  });

  const viewport = window.visualViewport;
  if (!viewport || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let previousGap = null;
  let response = 0;
  let velocity = 0;
  let frame = 0;
  let lastTime = 0;

  function animateResponse(time) {
    if (!lastTime) lastTime = time;
    const dt = Math.min((time - lastTime) / 1000, 0.032);
    lastTime = time;

    const acceleration = (-response * 170) - (velocity * 24);
    velocity += acceleration * dt;
    response += velocity * dt;

    if (Math.abs(response) < 0.00002 && Math.abs(velocity) < 0.0002) {
      response = 0;
      velocity = 0;
      header.style.setProperty('--header-glass-response', '0');
      frame = 0;
      lastTime = 0;
      return;
    }

    header.style.setProperty('--header-glass-response', response.toFixed(5));
    frame = window.requestAnimationFrame(animateResponse);
  }

  function respondToViewport() {
    const visibleBottom = viewport.offsetTop + viewport.height;
    const gap = Math.max(0, window.innerHeight - visibleBottom);

    if (previousGap !== null) {
      const delta = gap - previousGap;
      if (Math.abs(delta) > 0.5) {
        response = Math.max(-0.002, Math.min(0.002, response + delta * 0.000035));
        velocity += Math.max(-0.0008, Math.min(0.0008, delta * 0.00002));
        if (!frame) frame = window.requestAnimationFrame(animateResponse);
      }
    }
    previousGap = gap;
  }

  viewport.addEventListener('resize', respondToViewport, { passive: true });
  viewport.addEventListener('scroll', respondToViewport, { passive: true });
  window.addEventListener('orientationchange', respondToViewport, { passive: true });
  respondToViewport();
})();