// ---------- Выбор тарифа и синхронизация с формой заявки ----------
(function () {
  const selected = document.getElementById('selectedPlan');
  const heading = document.querySelector('.signup h2');
  const lead = document.querySelector('.signup__lead');
  const submit = document.querySelector('#signupForm button[type="submit"]');
  const selectedName = document.getElementById('selectedPlanName');
  const selectedPrice = document.getElementById('selectedPlanPrice');
  const cards = Array.from(document.querySelectorAll('[data-plan-card]'));
  const continueLink = document.getElementById('pricingContinue');
  const details = {
    trial_3d: {wireId:TRIAL_PLAN_WIRE_ID, name:'Пробный доступ – 3 дня бесплатно', price:'0 ₽ · без автоматического списания', button:'Попробовать бесплатно'},
    monthly: {wireId:'monthly', name:'Подписка на 1 месяц', price:'490 ₽ · оплата пока не подключена', button:'Продолжить с выбранным тарифом'},
    quarterly: {wireId:'quarterly', name:'Подписка на 3 месяца', price:'1 290 ₽ · 430 ₽ в месяц · оплата пока не подключена', button:'Продолжить с выбранным тарифом'},
    annual: {wireId:'annual', name:'Подписка на 12 месяцев', price:'4 490 ₽ · около 374 ₽ в месяц · оплата пока не подключена', button:'Продолжить с выбранным тарифом'}
  };
  function normalizePlan(plan) {
    if (plan === TRIAL_PLAN_WIRE_ID) return 'trial_3d';
    return details[plan] ? plan : 'trial_3d';
  }
  function choose(plan, focusCard) {
    const key = normalizePlan(plan);
    const item = details[key];
    if (selected) selected.value = item.wireId;
    cards.forEach(function (card) {
      const active = card.dataset.planCard === key;
      card.classList.toggle('is-selected', active);
      card.setAttribute('aria-checked', active ? 'true' : 'false');
      card.tabIndex = active ? 0 : -1;
      if (active) card.setAttribute('aria-current', 'true');
      else card.removeAttribute('aria-current');
    });
    if (continueLink) continueLink.textContent = item.button;
    if (heading) { heading.textContent = 'Начни с бесплатных 3 дней'; heading.hidden = false; }
    if (lead) {
      lead.textContent = 'Оставь заявку – мы свяжемся с родителем и объясним, как получить доступ. Оплата на сайте пока не подключена.';
      lead.hidden = false;
    }
    if (submit) submit.textContent = 'Отправить';
    if (selectedName) selectedName.textContent = item.name;
    if (selectedPrice) selectedPrice.textContent = item.price;
    if (focusCard) {
      const activeCard = cards.find(card => card.dataset.planCard === key);
      if (activeCard) activeCard.focus();
    }
  }
  cards.forEach(function (card, index) {
    card.addEventListener('click', function () { choose(card.dataset.planCard, false); });
    card.addEventListener('keydown', function (event) {
      let nextIndex = index;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = Math.min(cards.length - 1, index + 1);
      else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') nextIndex = Math.max(0, index - 1);
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = cards.length - 1;
      else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        choose(card.dataset.planCard, false);
        return;
      } else return;
      event.preventDefault();
      choose(cards[nextIndex].dataset.planCard, true);
    });
  });
  if (continueLink) continueLink.addEventListener('click', function (event) {
    event.preventDefault();
    const target = document.getElementById('signup');
    if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
  });
  choose(selected ? selected.value : 'trial_3d', false);
})();
