// ---------- Карусель тарифов без резкого перехода с конца на начало ----------
(function () {
  const carousel = document.getElementById('pricingCarousel');
  const track = carousel && carousel.querySelector('.pricing__grid');
  if (!carousel || !track) return;
  const cards = Array.from(track.querySelectorAll(':scope > .price'));
  if (!cards.length) return;

  const dots = Array.from(carousel.querySelectorAll('[data-carousel-dot]'));
  let index = 0;
  let scrollFrame = 0;
  let settleTimer = 0;
  let programmaticScroll = false;

  function updateDots() {
    dots.forEach((dot, i) => dot.setAttribute('aria-current', i === index ? 'true' : 'false'));
  }
  function getNearestIndex() {
    const trackCenter = track.getBoundingClientRect().left + track.clientWidth / 2;
    let nearest = 0;
    let distance = Infinity;
    cards.forEach((card, i) => {
      const rect = card.getBoundingClientRect();
      const currentDistance = Math.abs(rect.left + rect.width / 2 - trackCenter);
      if (currentDistance < distance) {
        distance = currentDistance;
        nearest = i;
      }
    });
    return nearest;
  }
  function finishProgrammaticScroll() {
    if (!programmaticScroll) return;
    programmaticScroll = false;
    window.clearTimeout(settleTimer);
    index = getNearestIndex();
    updateDots();
  }
  function scrollToIndex(next) {
    const target = Math.max(0, Math.min(cards.length - 1, next));
    if (target === index && !programmaticScroll) return;
    index = target;
    programmaticScroll = true;
    window.clearTimeout(settleTimer);
    const targetLeft = cards[target].getBoundingClientRect().left
      - track.getBoundingClientRect().left + track.scrollLeft;
    track.scrollTo({left:targetLeft, behavior:'smooth'});
    updateDots();
    settleTimer = window.setTimeout(finishProgrammaticScroll, 900);
  }

  const prev = carousel.querySelector('[data-carousel-prev]');
  const next = carousel.querySelector('[data-carousel-next]');
  if (prev) prev.addEventListener('click', () => scrollToIndex(index - 1));
  if (next) next.addEventListener('click', () => scrollToIndex(index + 1));
  dots.forEach(dot => dot.addEventListener('click', () => scrollToIndex(Number(dot.dataset.carouselDot))));

  track.addEventListener('scroll', () => {
    if (programmaticScroll) {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(finishProgrammaticScroll, 180);
      return;
    }
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
      index = getNearestIndex();
      updateDots();
      scrollFrame = 0;
    });
  }, {passive:true});
  track.addEventListener('scrollend', finishProgrammaticScroll, {passive:true});

  const selectedIndex = Math.max(0, cards.findIndex(card => card.classList.contains('is-selected')));
  index = selectedIndex;
  requestAnimationFrame(() => {
    const targetLeft = cards[index].getBoundingClientRect().left
      - track.getBoundingClientRect().left + track.scrollLeft;
    track.scrollLeft = targetLeft;
    updateDots();
  });
  window.addEventListener('resize', () => {
    const targetLeft = cards[index].getBoundingClientRect().left
      - track.getBoundingClientRect().left + track.scrollLeft;
    track.scrollLeft = targetLeft;
  });
})(); 
