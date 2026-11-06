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

