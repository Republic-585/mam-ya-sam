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
})();

// ---------- Scroll Progress Bar ----------
function getScrollProgress(scrollTop, scrollHeight, viewportHeight) {
  const maxScroll = Math.max(0, scrollHeight - viewportHeight);
  if (maxScroll === 0) return 0;
  const ratio = Math.min(1, Math.max(0, scrollTop / maxScroll));
  return Math.round(ratio * 100);
}

(function() {
  const bar = document.getElementById('progressBar');
  const text = document.getElementById('progressText');
  const track = document.getElementById('pageProgress');

  if (!bar || !text) return;

  let frame = 0;

  function updateProgress() {
    const roundedProgress = getScrollProgress(
      window.scrollY || window.pageYOffset || 0,
      document.documentElement.scrollHeight,
      window.innerHeight || document.documentElement.clientHeight
    );

    bar.style.width = roundedProgress + '%';
    text.textContent = roundedProgress + '%';
    if (track) track.setAttribute('aria-valuenow', String(roundedProgress));
  }

  function scheduleProgressUpdate() {
    if (frame) return;
    frame = window.requestAnimationFrame(function() {
      frame = 0;
      updateProgress();
    });
  }

  window.addEventListener('scroll', scheduleProgressUpdate, {passive: true});
  window.addEventListener('resize', scheduleProgressUpdate);
  window.addEventListener('orientationchange', scheduleProgressUpdate);
  window.addEventListener('load', scheduleProgressUpdate);
  document.addEventListener('toggle', scheduleProgressUpdate, true);

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', scheduleProgressUpdate);
  }

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(scheduleProgressUpdate);
    observer.observe(document.documentElement);
    if (document.body) observer.observe(document.body);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(scheduleProgressUpdate).catch(function() {});
  }

  updateProgress();
})();

// Видео встроено через iframe Muuvee.

// Идентификатор пробного тарифа в контракте с Supabase/Telegram.
// Историческое имя trial_7d сохранено для совместимости, но продукт даёт 3 дня.
const TRIAL_PLAN_WIRE_ID = 'trial_7d';

// ---------- Выбор тарифа: карточка, кнопка и форма синхронизированы ----------
(function () {
  const selected = document.getElementById('selectedPlan');
  const heading = document.querySelector('.signup h2');
  const lead = document.querySelector('.signup__lead');
  const submit = document.querySelector('#signupForm button[type="submit"]');
  const selectedName = document.getElementById('selectedPlanName');
  const selectedPrice = document.getElementById('selectedPlanPrice');
  const cards = Array.from(document.querySelectorAll('[data-plan-card]'));
  const details = {
    trial_3d: {wireId:TRIAL_PLAN_WIRE_ID, name:'Пробный доступ — 3 дня бесплатно', price:'0 ₽ · без автоматического списания', heading:'Начни с бесплатных 3 дней', lead:'Оставь заявку родителя. Мы проверим заявку и свяжемся с вами, чтобы активировать пробный доступ.', button:'Запросить бесплатный доступ'},
    monthly: {wireId:'monthly', name:'Подписка на 1 месяц', price:'490 ₽ · оплата пока не подключена', heading:'Выбран тариф на 1 месяц', lead:'Тариф выбран. Оставь контакты родителя — мы сообщим, как оформить подписку. Деньги сейчас не списываются.', button:'Запросить этот тариф'},
    quarterly: {wireId:'quarterly', name:'Подписка на 3 месяца', price:'1 290 ₽ · 430 ₽ в месяц · оплата пока не подключена', heading:'Выбран тариф на 3 месяца', lead:'Тариф выбран. Оставь контакты родителя — мы сообщим, как оформить подписку. Деньги сейчас не списываются.', button:'Запросить этот тариф'},
    annual: {wireId:'annual', name:'Подписка на 12 месяцев', price:'4 490 ₽ · около 374 ₽ в месяц · оплата пока не подключена', heading:'Выбран тариф на 12 месяцев', lead:'Тариф выбран. Оставь контакты родителя — мы сообщим, как оформить подписку. Деньги сейчас не списываются.', button:'Запросить этот тариф'}
  };
  function normalizePlan(plan) {
    if (plan === TRIAL_PLAN_WIRE_ID) return 'trial_3d';
    return details[plan] ? plan : 'trial_3d';
  }
  function choose(plan, scroll) {
    const key = normalizePlan(plan);
    const item = details[key];
    if (selected) selected.value = item.wireId;
    cards.forEach(function (card) {
      const active = card.dataset.planCard === key;
      card.classList.toggle('is-selected', active);
      if (active) card.setAttribute('aria-current', 'true');
      else card.removeAttribute('aria-current');
      card.querySelectorAll('.plan-select').forEach(function (button) {
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
        button.textContent = active
          ? (key === 'trial_3d' ? '✓ Выбран · попробовать бесплатно' : '✓ Тариф выбран')
          : (button.dataset.plan === 'trial_3d' ? 'Попробовать бесплатно' : 'Выбрать тариф');
      });
    });
    if (heading) heading.textContent = item.heading;
    if (lead) lead.textContent = item.lead;
    if (submit) submit.textContent = item.button;
    if (selectedName) selectedName.textContent = item.name;
    if (selectedPrice) selectedPrice.textContent = item.price;
    if (scroll) {
      const target = document.getElementById('signup');
      if (target) target.scrollIntoView({behavior:'smooth',block:'start'});
    }
  }
  document.querySelectorAll('.plan-select').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      choose(this.dataset.plan || 'trial_3d', true);
    });
  });
  choose(selected ? selected.value : 'trial_3d', false);
})();

// ---------- Signup form -> Supabase ----------
(function () {
  const form = document.getElementById('signupForm');
  const status = document.getElementById('signupStatus');
  if (!form || !status) return;

  const endpoint = 'https://hvhtbjrecbxlfwmbmaej.supabase.co/functions/v1/signup-request';
  const publishableKey = 'sb_publishable_nxhUTX_pEb8f0tJP8R-nQg_zG5PH-7x';
  const requestTimeoutMs = 15000;
  const startedAt = Date.now();

  function safeTelegramUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || !['t.me', 'telegram.me'].includes(url.hostname.toLowerCase())) return null;
      return url.href;
    } catch (_) {
      return null;
    }
  }

  let submitting = false;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (submitting) return;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const nameInput = form.elements.name;
    const emailInput = form.elements.email;
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    if (!name || !email) {
      status.dataset.state = 'error';
      status.textContent = 'Укажи имя родителя и email — без них мы не сможем связаться.';
      (name ? emailInput : nameInput).focus();
      return;
    }

    submitting = true;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn ? btn.textContent : 'Я с вами!';
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Отправляем…';
    }
    status.textContent = '';
    status.removeAttribute('data-state');

    const payload = {
      name: name,
      selectedPlan: form.elements.selectedPlan.value,
      phone: form.elements.phone.value.trim(),
      email: email,
      comment: form.elements.comment.value.trim(),
      consent: form.elements.consent.checked,
      website: form.elements.website.value,
      startedAt
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(function () {
      controller.abort();
    }, requestTimeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'apikey': publishableKey,
          'Authorization': 'Bearer ' + publishableKey
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        const errorCode = typeof result.error === 'string' ? result.error : '';
        if (errorCode === 'please_wait') {
          throw new Error('Подожди пару секунд и отправь форму ещё раз.');
        }
        if (response.status === 429) {
          throw new Error('Слишком много попыток. Подождите немного и попробуйте снова.');
        }
        if (response.status === 400) {
          throw new Error('Проверь имя, email и согласие на обработку данных.');
        }
        throw new Error('Не удалось отправить заявку. Попробуй ещё раз чуть позже.');
      }

      const chosenPlan = form.elements.selectedPlan.value;
      const telegramUrl = result.telegramUrl ? safeTelegramUrl(result.telegramUrl) : null;
      if (result.telegramUrl && !telegramUrl) {
        status.dataset.state = 'error';
        status.textContent = 'Заявка сохранена, но ссылка на Telegram некорректна. Свяжитесь с нами для продолжения.';
      }
      if (chosenPlan === TRIAL_PLAN_WIRE_ID && telegramUrl) {
        status.dataset.state = 'success';
        status.textContent = 'Заявка принята! Сейчас откроется Telegram-бот, чтобы активировать бесплатные 3 дня.';
        if (btn) btn.textContent = 'Открываем Telegram…';
        form.reset();
        const hiddenPlan = document.getElementById('selectedPlan');
        if (hiddenPlan) hiddenPlan.value = chosenPlan;
        window.location.href = telegramUrl;
        return;
      }
      status.dataset.state = telegramUrl ? 'success' : 'error';
      status.textContent = telegramUrl
        ? 'Заявка принята! Сейчас откроется Telegram-бот для следующего шага.'
        : result.telegramUrl
          ? 'Заявка сохранена, но ссылка на Telegram некорректна. Свяжитесь с нами для продолжения.'
          : 'Заявка сохранена, но ссылка на Telegram пока не сформирована. Попробуйте позже или свяжитесь с нами.';
      if (telegramUrl) window.location.href = telegramUrl;
      const keepPlan = chosenPlan;
      form.reset();
      const hiddenPlan = document.getElementById('selectedPlan');
      if (hiddenPlan) hiddenPlan.value = keepPlan;
      if (btn) {
        btn.textContent = telegramUrl ? 'Открываем Telegram…' : originalText;
        btn.disabled = false;
      }
    } catch (error) {
      status.dataset.state = 'error';
      status.textContent = error && error.name === 'AbortError'
        ? 'Сервер долго не отвечает. Проверьте интернет и попробуйте ещё раз.'
        : error instanceof Error
          ? error.message
          : 'Не удалось отправить заявку. Попробуй ещё раз чуть позже.';
      if (btn) {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    } finally {
      clearTimeout(timeoutId);
      submitting = false;
    }
  });
})();

// ---------- ПАСХАЛКИ (JS) ----------
(function() {
  // Универсальная функция для создания частиц
  function spawnParticles(element, emojis, count) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      
      // Начальная позиция
      particle.style.left = centerX + 'px';
      particle.style.top = centerY + 'px';

      // Случайный угол и дистанция разлета
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 100; // от 50 до 150px
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      const rot = (Math.random() - 0.5) * 360 + 'deg';

      particle.style.setProperty('--tx', tx + 'px');
      particle.style.setProperty('--ty', ty + 'px');
      particle.style.setProperty('--rot', rot);

      document.body.appendChild(particle);

      // Удаляем частицу после завершения анимации
      setTimeout(() => {
        particle.remove();
      }, 1000);
    }
  }

  // 1. Логотип в шапке
  const logoDot = document.getElementById('easterEggLogo');
  if (logoDot) {
    logoDot.addEventListener('click', function(e) {
      e.stopPropagation(); // Чтобы не срабатывал переход по ссылке
      this.classList.remove('spin-animation');
      void this.offsetWidth; // Трюк для перезапуска анимации
      this.classList.add('spin-animation');
      
      spawnParticles(this, ['✨', '🌟', '💫', '😎'], 8);
    });
  }

  // Центральное солнце декоративное: без нажатия и обработчика.

  // 3. Калькулятор (Математика)
  const mathText = document.getElementById('easterEggMath');
  if (mathText) {
    mathText.addEventListener('click', function() {
      spawnParticles(this, ['➕', '💰', '🪙', '📈', '1️⃣'], 10);
    });
  }

  // 4. Бейдж "Я МОГУ!" (В зеленом блоке)
  const badge = document.getElementById('easterEggBadge');
  if (badge) {
    badge.addEventListener('click', function() {
      this.classList.remove('shake-animation');
      void this.offsetWidth;
      this.classList.add('shake-animation');
      
      spawnParticles(this, ['🎉', '⭐', '🏆', '🎊'], 15);
    });
  }
})();


/* Дополнительная интерактивность страницы */
(function(){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealTargets = document.querySelectorAll(
    '.hero__content,.parents__head,.parents__grid>*,.problems h2,.problems__lead,.problem,.problems__recs,.adult h2,.icons h2,.icon-card,.steps h2,.steps__pill,.steps__big,.skill h2,.skill__item,.result h2,.video h2,.video__player,.video__cta,.about__photo,.about__content,.format h2,.format__grid>*,.pricing h2,.pricing__grid>*,.faq h2,.faq details,.signup h2,.signup form'
  );
  if(!reduceMotion && 'IntersectionObserver' in window){
    document.body.classList.add('js-motion-ready');
    const observer = new IntersectionObserver((entries, obs)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },{threshold:.12,rootMargin:'0px 0px -35px 0px'});
    revealTargets.forEach((el,index)=>{
      el.classList.add('motion-reveal');
      el.style.setProperty('--motion-delay', '0ms');
      observer.observe(el);
    });
  }

})();
