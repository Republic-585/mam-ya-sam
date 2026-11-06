
(function () {
  const header = document.querySelector('header.topbar');
  if (!header || !window.visualViewport) return;

  const viewport = window.visualViewport;
  let frame = 0;

  function syncHeaderToVisibleViewport() {
    if (frame) return;
    frame = window.requestAnimationFrame(function () {
      frame = 0;
      const visibleBottom = viewport.offsetTop + viewport.height;
      const layoutHeight = window.innerHeight;
      const gap = Math.max(0, layoutHeight - visibleBottom);
      document.documentElement.style.setProperty(
        '--safari-visible-bottom-gap',
        gap.toFixed(2) + 'px'
      );
    });
  }

  viewport.addEventListener('resize', syncHeaderToVisibleViewport, {passive:true});
  viewport.addEventListener('scroll', syncHeaderToVisibleViewport, {passive:true});
  window.addEventListener('resize', syncHeaderToVisibleViewport, {passive:true});
  window.addEventListener('orientationchange', syncHeaderToVisibleViewport, {passive:true});
  syncHeaderToVisibleViewport();
})();
