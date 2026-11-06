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
