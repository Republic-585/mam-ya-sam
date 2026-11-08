(() => {
  'use strict';

  const initReviewsStack = () => {
    const section = document.querySelector('#reviews');
    const grid = section?.querySelector('.reviews__grid');
    if (!section || !grid || grid.dataset.stackReady === 'true') return;

    const cards = Array.from(grid.querySelectorAll('.reviews__card'));
    if (cards.length < 2) return;

    grid.dataset.stackReady = 'true';
    grid.classList.add('reviews__stack');
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', 'Стопка отзывов. Перелистывайте вверх и вниз');

    cards.forEach((card, index) => {
      card.setAttribute('aria-label', `Отзыв ${index + 1} из ${cards.length}`);
      card.setAttribute('tabindex', '-1');
      card.style.top = '22px';
    });

    const controls = document.createElement('div');
    controls.className = 'reviews__stack-controls';
    controls.innerHTML = `
      <button class="reviews__stack-button" type="button" data-step="-1" aria-label="Предыдущий отзыв">
        <span aria-hidden="true">↑</span>
      </button>
      <div class="reviews__stack-progress" aria-live="polite" aria-atomic="true">
        <div class="reviews__stack-count"><span data-current>01</span><span aria-hidden="true"> / </span><span data-total>${String(cards.length).padStart(2, '0')}</span></div>
        <div class="reviews__stack-track" aria-hidden="true"><span data-progress></span></div>
      </div>
      <button class="reviews__stack-button" type="button" data-step="1" aria-label="Следующий отзыв">
        <span aria-hidden="true">↓</span>
      </button>`;
    grid.after(controls);

    const current = controls.querySelector('[data-current]');
    const progress = controls.querySelector('[data-progress]');
    const previousButton = controls.querySelector('[data-step="-1"]');
    const nextButton = controls.querySelector('[data-step="1"]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let active = 0;
    let touchStart = null;
    let resizeObserver = null;

    const measureStage = () => {
      const activeCard = cards[active];
      if (!activeCard) return;
      const height = Math.ceil(activeCard.getBoundingClientRect().height);
      grid.style.height = `${height + 54}px`;
    };

    const render = () => {
      cards.forEach((card, index) => {
        const isActive = index === active;
        const offset = index - active;
        const depth = Math.abs(offset);
        const isNearby = !isActive && depth <= 3;
        const direction = Math.sign(offset);

        card.hidden = !isActive && !isNearby;
        card.classList.toggle('is-active', isActive);
        card.classList.toggle('is-back', !isActive && isNearby);
        card.style.zIndex = isActive ? '10' : isNearby ? String(10 - depth) : '0';
        card.style.transform = isActive
          ? 'translate3d(0,0,0) scale(1)'
          : isNearby
            ? `translate3d(0,${direction * depth * 12}px,0) scale(${1 + depth * 0.025})`
            : 'translate3d(0,0,0) scale(.94)';
        card.style.opacity = isActive ? '1' : isNearby ? String(0.94 - depth * 0.07) : '0';
        card.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        card.inert = !isActive;
      });

      current.textContent = String(active + 1).padStart(2, '0');
      progress.style.width = `${((active + 1) / cards.length) * 100}%`;
      previousButton.disabled = active === 0;
      nextButton.disabled = active === cards.length - 1;

      requestAnimationFrame(measureStage);
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver.observe(cards[active]);
      }
    };

    const move = (step) => {
      const next = Math.max(0, Math.min(cards.length - 1, active + step));
      if (next === active) return;
      active = next;
      render();
    };

    controls.addEventListener('click', event => {
      const button = event.target.closest('[data-step]');
      if (!button || button.disabled) return;
      move(Number(button.dataset.step));
    });

    grid.addEventListener('touchstart', event => {
      if (event.touches.length !== 1 || event.target.closest('a,button')) {
        touchStart = null;
        return;
      }
      const touch = event.touches[0];
      touchStart = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    }, { passive: true });

    grid.addEventListener('touchend', event => {
      if (!touchStart || !event.changedTouches.length) return;
      const touch = event.changedTouches[0];
      const deltaY = touch.clientY - touchStart.y;
      const deltaX = touch.clientX - touchStart.x;
      const elapsed = Date.now() - touchStart.time;
      touchStart = null;

      if (elapsed > 700 || Math.abs(deltaY) < 48 || Math.abs(deltaY) < Math.abs(deltaX) * 1.2) return;
      move(deltaY < 0 ? 1 : -1);
    }, { passive: true });

    grid.addEventListener('touchcancel', () => {
      touchStart = null;
    }, { passive: true });

    section.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        move(1);
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        move(-1);
      }
    });

    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(measureStage);
    }
    window.addEventListener('resize', measureStage, { passive: true });

    if (reducedMotion.matches) grid.classList.add('reviews__reduced-motion');
    render();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReviewsStack, { once: true });
  } else {
    initReviewsStack();
  }
})();