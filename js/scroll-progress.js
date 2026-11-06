// ---------- Полоска прогресса прокрутки ----------
(function() {
  const bar = document.getElementById('progressBar');
  if (!bar) return;
  let scheduled = false;
  function updateProgress() {
    const root = document.documentElement;
    const scrollTop = Math.max(window.scrollY || root.scrollTop || 0, 0);
    const docHeight = Math.max(root.scrollHeight, document.body ? document.body.scrollHeight : 0) - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
    bar.style.transform = 'scaleX(' + (progress / 100) + ')';
    scheduled = false;
  }
  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(updateProgress);
  }
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  window.addEventListener('orientationchange', scheduleUpdate, { passive: true });
  scheduleUpdate();
  window.addEventListener('load', scheduleUpdate, { once: true });
  window.addEventListener('pageshow', scheduleUpdate);
})();
