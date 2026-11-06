(function () {
  const header = document.querySelector('header.topbar');
  if (!header) return;
  function syncMenuHeight() {
    document.documentElement.style.setProperty('--topbar-height', header.getBoundingClientRect().height.toFixed(2) + 'px');
  }
  syncMenuHeight();
  window.addEventListener('resize', syncMenuHeight, {passive:true});
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncMenuHeight, {passive:true});
  }
})();
