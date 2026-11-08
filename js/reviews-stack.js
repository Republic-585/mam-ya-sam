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
    cards.forEach((card, index) => {
      card.setAttribute('aria-label', `Отзыв ${index + 1} из ${cards.length}`);
      card.setAttribute('tabindex', '-1');
    });

    const controls = document.createElement('div');
    controls.className = 'reviews__stack-controls';
    controls.innerHTML = `
      <button class="reviews__stack-button" type="button" data-step="-1" aria-label="Предыдущий отзыв">
        <span aria-hidden="true">↑</span>
      </button>
      <div class="reviews__stack-progress" aria-live="polite">
        <div class="reviews__stack-count"><span data-current>01</span><span aria-hidden="true"> / </span><span data-total>${String(cards.length).padStart(2, '0')}</span></div>
        <div class="reviews__stack-track"><span data-progress></span></div>
      </div>
      <button class="reviews__stack-button" type="button" data-step="1" aria-label="Следующий отзыв">
        <span aria-hidden="true">↓</span>
      </button>`;
    grid.after(controls);

    const current = controls.querySelector('[data-current]');
    const progress = controls.querySelector('[data-progress]');
    let active = 0;

    const render = () => {
      cards.forEach((card, index) => {
        card.classList.toggle('is-active', index === active);
        card.classList.toggle('is-next', index === active + 1);
        card.hidden = index !== active && index !== active + 1;
        card.setAttribute('aria-hidden', index === active ? 'false' : 'true');
      });
      current.textContent = String(active + 1).padStart(2, '0');
      progress.style.width = `${((active + 1) / cards.length) * 100}%`;
      controls.querySelector('[data-step="-1"]').disabled = active === 0;
      controls.querySelector('[data-step="1"]').disabled = active === cards.length - 1;
    };

    controls.addEventListener('click', event => {
      const button = event.target.closest('[data-step]');
      if (!button || button.disabled) return;
      active = Math.max(0, Math.min(cards.length - 1, active + Number(button.dataset.step)));
      render();
    });

    section.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        active = Math.min(cards.length - 1, active + 1);
        render();
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        active = Math.max(0, active - 1);
        render();
      }
    });

    render();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReviewsStack, { once: true });
  } else {
    initReviewsStack();
  }
})();