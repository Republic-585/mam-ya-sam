
(function() {
  const button = document.querySelector('.back-to-top');
  if (!button) return;
  let frame = 0;
  const isLight = (color) => {
    const match = color.match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const parts = match[1].split(',').map(v => parseFloat(v.trim()));
    if (parts.length < 3 || (parts.length > 3 && parts[3] === 0)) return null;
    const rgb = parts.slice(0, 3).map(v => {
      v /= 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2] > 0.42;
  };
  const secondBlock = document.querySelector('#skill');
  const update = function() {
    const secondBlockTop = secondBlock ? secondBlock.getBoundingClientRect().top + window.scrollY : 300;
    button.classList.toggle('is-visible', window.scrollY >= secondBlockTop - 24);
    const rect = button.getBoundingClientRect();
    // Five representative samples preserve contrast detection while avoiding
    // repeated style recalculation across nine points on every scroll frame.
    const points = [
      [rect.left + rect.width * 0.5, rect.top + rect.height * 0.24],
      [rect.left + rect.width * 0.28, rect.top + rect.height * 0.5],
      [rect.left + rect.width * 0.5, rect.top + rect.height * 0.5],
      [rect.left + rect.width * 0.72, rect.top + rect.height * 0.5],
      [rect.left + rect.width * 0.5, rect.top + rect.height * 0.76]
    ];
    const originalPointerEvents = button.style.pointerEvents;
    button.style.pointerEvents = 'none';
    const results = [];
    const styleCache = new Map();
    try {
      for (const [x, y] of points) {
        let node = document.elementFromPoint(x, y);
        let light = null;
        while (node && node !== document.documentElement) {
          let candidates = styleCache.get(node);
          if (!candidates) {
            const styles = window.getComputedStyle(node);
            candidates = [
              styles.backgroundColor,
              window.getComputedStyle(node, '::before').backgroundColor,
              window.getComputedStyle(node, '::after').backgroundColor
            ];
            styleCache.set(node, candidates);
          }
          for (const candidate of candidates) {
            const value = isLight(candidate);
            if (value !== null) { light = value; break; }
          }
          if (light !== null) break;
          node = node.parentElement;
        }
        if (light !== null) results.push(light);
      }
    } finally {
      button.style.pointerEvents = originalPointerEvents;
    }
    const lightCount = results.filter(Boolean).length;
    const darkCount = results.length - lightCount;
    if (results.length) button.classList.toggle('is-on-light', lightCount > darkCount);
  };
  const scheduleUpdate = function() {
    if (frame) return;
    frame = window.requestAnimationFrame(() => { frame = 0; update(); });
  };
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  // Let the first screen render before calculating arrow contrast.
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(scheduleUpdate, { timeout: 1200 });
  } else {
    window.setTimeout(scheduleUpdate, 250);
  }
  button.addEventListener('click', function(event) {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
