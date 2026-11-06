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
