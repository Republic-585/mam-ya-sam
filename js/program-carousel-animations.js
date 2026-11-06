
/* Анимации только для карусели программы курса. Не зависят от GSAP/CDN. */
(function () {
  const section = document.getElementById('program-all');
  const carousel = section && section.querySelector('.program-all__carousel');
  if (!section || !carousel) return;

  const cards = Array.from(carousel.querySelectorAll('.program-all__card'));
  if (!cards.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const style = document.createElement('style');
  style.textContent = [
    '#program-all .program-all__card.course-card-reveal { opacity: 0; transform: translateY(26px); transition: opacity .65s ease, transform .65s cubic-bezier(.22,.61,.36,1); }',
    '#program-all .program-all__card.course-card-reveal.course-card-visible { opacity: 1; transform: translateY(0); }',
    '#program-all .program-all__card.course-card-pressed { transform: scale(.97); transition: transform .14s ease-out; }',
    '@media (prefers-reduced-motion: reduce) { #program-all .program-all__card.course-card-reveal { opacity: 1; transform: none; transition: none; } }'
  ].join('');
  document.head.appendChild(style);

  cards.forEach(function (card, index) {
    card.classList.add('course-card-reveal');
    card.style.transitionDelay = (index * 90) + 'ms';
    card.addEventListener('pointerdown', function () {
      card.classList.add('course-card-pressed');
    }, { passive: true });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (eventName) {
      card.addEventListener(eventName, function () {
        card.classList.remove('course-card-pressed');
      }, { passive: true });
    });
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        cards.forEach(function (card) {
          card.classList.add('course-card-visible');
          card.style.transitionDelay = '';
        });
        observer.disconnect();
      });
    }, { threshold: 0.08 });
    observer.observe(section);
  } else {
    cards.forEach(function (card) { card.classList.add('course-card-visible'); });
  }
})();
