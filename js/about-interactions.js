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
