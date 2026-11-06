
// ---------- Public offer dialog ----------
(function() {
  const dialog = document.getElementById('public-offer');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  let lastTrigger = null;
  document.querySelectorAll('a[href="#public-offer"]').forEach(function(link) {
    link.addEventListener('click', function(event) {
      event.preventDefault();
      lastTrigger = link;
      if (!dialog.open) dialog.showModal();
    });
  });
  const closeButton = dialog.querySelector('[data-close-offer]');
  if (closeButton) closeButton.addEventListener('click', function() { dialog.close(); });
  dialog.addEventListener('click', function(event) {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', function() {
    if (lastTrigger) lastTrigger.focus();
  });
})();

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

// Плеер оставлен как лёгкий контейнер; источник видео подключим позже.

// Идентификатор пробного тарифа в контракте с Supabase/Telegram.
// Историческое имя trial_7d сохранено для совместимости, но продукт даёт 3 дня.
const TRIAL_PLAN_WIRE_ID = 'trial_7d';

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
    trial_3d: {wireId:TRIAL_PLAN_WIRE_ID, name:'Пробный доступ – 3 дня бесплатно', price:'0 ₽ · без автоматического списания', heading:'', lead:'', button:'Запросить бесплатный доступ'},
    monthly: {wireId:'monthly', name:'Подписка на 1 месяц', price:'490 ₽ · оплата пока не подключена', heading:'Выбран тариф на 1 месяц', lead:'Тариф выбран. Оставь контакты родителя – мы сообщим, как оформить подписку. Деньги сейчас не списываются.', button:'Запросить этот тариф'},
    quarterly: {wireId:'quarterly', name:'Подписка на 3 месяца', price:'1 290 ₽ · 430 ₽ в месяц · оплата пока не подключена', heading:'Выбран тариф на 3 месяца', lead:'Тариф выбран. Оставь контакты родителя – мы сообщим, как оформить подписку. Деньги сейчас не списываются.', button:'Запросить этот тариф'},
    annual: {wireId:'annual', name:'Подписка на 12 месяцев', price:'4 490 ₽ · около 374 ₽ в месяц · оплата пока не подключена', heading:'Выбран тариф на 12 месяцев', lead:'Тариф выбран. Оставь контакты родителя – мы сообщим, как оформить подписку. Деньги сейчас не списываются.', button:'Запросить этот тариф'}
  };
  function normalizePlan(plan) {
    if (plan === TRIAL_PLAN_WIRE_ID) return 'trial_3d';
    return details[plan] ? plan : 'quarterly';
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
          ? (key === 'trial_3d' ? 'Выбран · попробовать бесплатно' : 'Тариф выбран')
          : (button.dataset.plan === 'trial_3d' ? 'Попробовать бесплатно' : 'Выбрать тариф');
      });
    });
    if (heading) { heading.textContent = 'Начни с бесплатных 3 дней'; heading.hidden = false; }
    if (lead) { lead.textContent = 'Оставь заявку – мы свяжемся с родителем и объясним, как получить доступ. Оплата на сайте пока не подключена.'; lead.hidden = false; }
    if (submit) submit.textContent = 'Отправить';
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

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = true;
    }
    status.textContent = '';
    status.removeAttribute('data-state');

    const payload = {
      name: form.elements.name.value.trim(),
      childName: form.elements.childName.value.trim(),
      childClass: form.elements.childClass.value,
      selectedPlan: form.elements.selectedPlan.value,
      phone: form.elements.phone.value.trim(),
      email: form.elements.email.value.trim(),
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
        if (response.status === 400) {
          throw new Error(result.error === 'please_wait'
            ? 'Подожди пару секунд и отправь форму ещё раз.'
            : 'Проверь имя родителя, данные ребёнка, email и согласие на обработку данных.');
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
      }
    } finally {
      clearTimeout(timeoutId);
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
      this.classList.add('easter-reset');
      void this.offsetWidth; // Трюк для перезапуска анимации
      this.classList.add('spin-animation');
      
      spawnParticles(this, ['✨', '🌟', '💫', '😎'], 8);
      this.addEventListener('animationend', () => {
        this.classList.remove('spin-animation');
      }, { once: true });
    });
    logoDot.addEventListener('mouseleave', function() {
      this.classList.remove('easter-reset');
    });
  }

  // Центральное солнце декоративное: без нажатия и обработчика.\n\n  // 3. Калькулятор (Математика)
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
    'section:not(.hero) h2,section:not(.hero) h3,section:not(.hero) p,section:not(.hero) .eyebrow,section:not(.hero) article,section:not(.hero) blockquote,section:not(.hero) details,section:not(.hero) .card,section:not(.hero) .problem,section:not(.hero) .problems__recs,section:not(.hero) .adult__item,section:not(.hero) .icon-card,section:not(.hero) .steps__pill,section:not(.hero) .steps__big,section:not(.hero) .skill__item,section:not(.hero) .video__player,section:not(.hero) .about__photo,section:not(.hero) .about__content,section:not(.hero) .about-v2 .about__mission,section:not(.hero) .format__grid>*,section:not(.hero) .pricing__grid>*,section:not(.hero) .signup form'
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
      el.style.setProperty('--motion-delay', (index % 5 * 65) + 'ms');
      observer.observe(el);
    });
  }

})();



/* Карусель миссий и отдельная логика заданий № 2 и № 3 */
(function(){
  const track=document.getElementById('missionsTrack');
  if(!track)return;
  const cards=Array.from(track.children);
  const dots=Array.from(document.querySelectorAll('[data-missions-index]'));
  function currentIndex(){return Math.max(0,Math.min(cards.length-1,Math.round(track.scrollLeft/(cards[0].getBoundingClientRect().width+18))));}
  function goTo(index){index=Math.max(0,Math.min(cards.length-1,index));track.scrollTo({left:cards[index].offsetLeft-track.offsetLeft,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});dots.forEach((dot,i)=>dot.setAttribute('aria-current',String(i===index)));}
  document.querySelectorAll('[data-missions-move]').forEach(btn=>btn.addEventListener('click',()=>goTo(currentIndex()+Number(btn.dataset.missionsMove))));
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>goTo(i)));
  let raf;
  track.addEventListener('scroll',()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{const idx=currentIndex();dots.forEach((dot,i)=>dot.setAttribute('aria-current',String(i===idx)));});},{passive:true});
  function setupMission(prefix,correct,feedbackId,hint,answers){
    const card=document.getElementById(prefix==='two'?'missionTwo':'missionThree');
    if(!card)return;
    const choices=Array.from(card.querySelectorAll('[data-mission-'+prefix+']'));
    const feedback=document.getElementById(feedbackId);
    const reset=card.querySelector('[data-mission-reset]');
    choices.forEach(button=>button.addEventListener('click',()=>{
      const ok=button.dataset['mission'+(prefix==='two'?'Two':'Three')]===correct;
      choices.forEach(item=>{item.disabled=true;});
      button.classList.add(ok?'is-correct':'is-wrong');
      if(!ok){const right=choices.find(item=>item.dataset['mission'+(prefix==='two'?'Two':'Three')]===correct);if(right)right.classList.add('is-correct');}
      feedback.textContent=answers[button.dataset['mission'+(prefix==='two'?'Two':'Three')]];
      feedback.dataset.state=ok?'success':'try';
      reset.hidden=false;
      const status=card.querySelector('.about-v2__game-status');
      if(status)status.innerHTML=ok?'<span aria-hidden="true">●</span> МИССИЯ ПРОЙДЕНА':'<span aria-hidden="true">●</span> ЕСТЬ ЕЩЁ ПОПЫТКА';
    }));
    reset.addEventListener('click',()=>{
      choices.forEach(item=>{item.disabled=false;item.classList.remove('is-correct','is-wrong');});
      feedback.textContent=hint;feedback.removeAttribute('data-state');reset.hidden=true;
      const status=card.querySelector('.about-v2__game-status');if(status)status.textContent=prefix==='two'?'ТВОЯ ОЧЕРЕДЬ':'ВЫБИРАЙ СТРАТЕГИЮ';
    });
  }
  setupMission('two','a','missionTwoFeedback','Подсказка: найди четверть от 1 200 ₽, затем вычти её из старой цены.',{
    a:'Верно! 25% от 1 200 ₽ – это 300 ₽. После скидки наушники стоят 900 ₽. Теперь ты знаешь, как проверить реальную выгоду.',
    b:'Пока нет. 1 000 ₽ означают скидку всего 200 ₽. Найди 25% от 1 200 ₽: это 300 ₽, поэтому итоговая цена – 900 ₽.',
    c:'300 ₽ – это размер скидки. Чтобы найти цену после скидки, вычти 300 ₽ из 1 200 ₽. Получится 900 ₽.'
  });
  setupMission('three','b','missionThreeFeedback','Подсказка: сначала узнай, сколько ещё нужно накопить до 1 800 ₽.',{
    a:'Ещё немного! Через 2 недели будет 1 050 + 500 = 1 550 ₽. До цели не хватает 250 ₽.',
    b:'Точно! Нужно накопить ещё 750 ₽. По 250 ₽ в неделю – это 3 недели. В итоге будет ровно 1 800 ₽.',
    c:'До цели не нужно ждать 4 недели. Осталось 750 ₽, а по 250 ₽ в неделю ты накопишь их за 3 недели.'
  });
})();

// ---------- Интерактивная задача внутри блока «О проекте» ----------
(function(){
  const game = document.getElementById('aboutGame');
  if (!game) return;
  const choices = Array.from(game.querySelectorAll('[data-game-choice]'));
  const feedback = document.getElementById('aboutGameFeedback');
  const restart = document.getElementById('aboutGameRestart');
  const messages = {
    a: {ok:false, text:'Почти! 1 000 − 870 = 130 ₽. Ты оплатил всё из списка, но до цели в 250 ₽ не хватает 120 ₽. Попробуй расставить приоритеты.'},
    b: {ok:true, text:'Миссия выполнена! 180 + 220 + 350 = 750 ₽. Из 1 000 ₽ остаётся 250 ₽ ровно на твою цель. Ты сохранил важные расходы и отказался только от необязательной покупки. Отличный план!'},
    c: {ok:false, text:'Деньги остались, но книгу ты отложил, а это одна из важных покупок в задаче. Подумай, можно ли сохранить проезд, обед и книгу, отказавшись от чего-то менее важного.'}
  };
  choices.forEach(function(button){
    button.addEventListener('click',function(){
      const result = messages[button.dataset.gameChoice];
      choices.forEach(function(item){item.disabled=true;});
      button.classList.add(result.ok?'is-correct':'is-wrong');
      if(!result.ok){
        const correct = game.querySelector('[data-game-choice="b"]');
        if(correct) correct.classList.add('is-correct');
      }
      feedback.textContent=result.text;
      feedback.dataset.state=result.ok?'success':'try';
      restart.hidden=false;
      const status=game.querySelector('.about-v2__game-status');
      if(status) status.innerHTML=result.ok?'<span aria-hidden="true">●</span> МИССИЯ ПРОЙДЕНА':'<span aria-hidden="true">●</span> ЕСТЬ ЕЩЁ ПОПЫТКА';
    });
  });
  restart.addEventListener('click',function(){
    choices.forEach(function(item){item.disabled=false;item.classList.remove('is-correct','is-wrong');});
    feedback.textContent='Подсказка: вычти расходы из 1 000 ₽ и проверь, сколько останется для цели.';
    feedback.textContent='Подсказка: вычти расходы из 1 000 ₽ и проверь, сколько останется для цели.';
    feedback.removeAttribute('data-state');
    restart.hidden=true;
    const status=game.querySelector('.about-v2__game-status');
    if(status) status.textContent='ТВОЙ ХОД';
  });
})();



/* Карусель достижений автора */
(function(){
  const track=document.getElementById('authorAchievements');
  if(!track)return;
  const cards=Array.from(track.children);
  const dots=Array.from(document.querySelectorAll('[data-achievement-dot]'));
  function index(){const center=track.scrollLeft+track.clientWidth/2;let best=0,dist=Infinity;cards.forEach((card,i)=>{const d=Math.abs(card.offsetLeft+card.offsetWidth/2-center);if(d<dist){dist=d;best=i;}});return best;}
  function goTo(i){i=Math.max(0,Math.min(cards.length-1,i));track.scrollTo({left:cards[i].offsetLeft-track.offsetLeft,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});dots.forEach((d,n)=>d.setAttribute('aria-current',String(n===i)));}
  document.querySelectorAll('[data-achievement-move]').forEach(b=>b.addEventListener('click',()=>goTo(index()+Number(b.dataset.achievementMove))));
  dots.forEach((d,i)=>d.addEventListener('click',()=>goTo(i)));
  let frame;
  track.addEventListener('scroll',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const i=index();dots.forEach((d,n)=>d.setAttribute('aria-current',String(n===i)));});},{passive:true});
})();

