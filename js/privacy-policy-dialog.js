// ---------- Privacy policy dialog ----------
(function() {
  const dialog = document.getElementById('privacy-policy');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  let lastTrigger = null;
  document.querySelectorAll('a[href="#privacy-policy"]').forEach(function(link) {
    link.addEventListener('click', function(event) {
      event.preventDefault();
      lastTrigger = link;
      if (!dialog.open) dialog.showModal();
    });
  });

  const closeButton = dialog.querySelector('[data-close-privacy]');
  if (closeButton) closeButton.addEventListener('click', function() {
    dialog.close();
  });

  dialog.addEventListener('click', function(event) {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener('close', function() {
    if (lastTrigger) lastTrigger.focus();
  });

  if (window.location.hash === '#privacy-policy' && !dialog.open) {
    dialog.showModal();
  }
})();
