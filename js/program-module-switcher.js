(function(){
  const section=document.getElementById('program-all');
  const switcher=section&&section.querySelector('#program-module-switcher');
  const carousel=section&&section.querySelector('.program-all__carousel');
  if(!section||!switcher||!carousel)return;
  const cards=Array.from(carousel.querySelectorAll('.program-all__card'));
  const buttons=Array.from(switcher.querySelectorAll('[data-module]'));
  cards.forEach(function(card){
    const text=card.textContent||'';
    const match=text.match(/модуль\s*([1-3])/i);
    const isContinuation=card.classList.contains('program-all__card--continuation');
    const isIntro=!match&&!isContinuation;
    card.dataset.programModule=match?match[1]:(isIntro?'intro':'continuation');
    card.hidden=false;
  });
  function setActive(module){
    buttons.forEach(function(button){
      const active=button.dataset.module===module;
      button.classList.toggle('is-active',active);
      button.setAttribute('aria-pressed',String(active));
    });
  }
  function moduleForCard(card){
    if(card.dataset.programModule==='intro')return '1';
    if(card.dataset.programModule==='continuation')return '3';
    return card.dataset.programModule;
  }
  function updateFromScroll(){
    const rect=carousel.getBoundingClientRect();
    const marker=rect.left+Math.min(carousel.clientWidth*.42,260);
    let closest=null;
    let distance=Infinity;
    cards.forEach(function(card){
      const cardRect=card.getBoundingClientRect();
      if(cardRect.right<=rect.left||cardRect.left>=rect.right)return;
      const center=cardRect.left+cardRect.width/2;
      const current=Math.abs(center-marker);
      if(current<distance){distance=current;closest=card;}
    });
    if(closest)setActive(moduleForCard(closest));
  }
  let scrollFrame=0;
  let programmaticScroll=false;
  let settleTimer=0;
  function scheduleUpdate(){
    if(programmaticScroll||scrollFrame)return;
    scrollFrame=requestAnimationFrame(function(){
      scrollFrame=0;
      if(!programmaticScroll)updateFromScroll();
    });
  }
  function finishProgrammaticScroll(){
    if(!programmaticScroll)return;
    programmaticScroll=false;
    if(settleTimer)window.clearTimeout(settleTimer);
  }
  buttons.forEach(function(button){
    button.addEventListener('click',function(){
      const module=button.dataset.module;
      const target=module==='1'
        ? cards.find(card=>card.dataset.programModule==='intro')
        : cards.find(card=>card.dataset.programModule===module);
      if(!target)return;
      const left=target.getBoundingClientRect().left-carousel.getBoundingClientRect().left+carousel.scrollLeft;
      const smooth=!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      programmaticScroll=smooth;
      if(settleTimer)window.clearTimeout(settleTimer);
      carousel.scrollTo({left:left,behavior:smooth?'smooth':'auto'});
      setActive(module);
      if(!smooth)programmaticScroll=false;
    });
  });
  carousel.addEventListener('scroll',function(){
    if(programmaticScroll){
      if(settleTimer)window.clearTimeout(settleTimer);
      settleTimer=window.setTimeout(finishProgrammaticScroll,220);
      return;
    }
    scheduleUpdate();
  },{passive:true});
  carousel.addEventListener('scrollend',finishProgrammaticScroll,{passive:true});
  window.addEventListener('resize',function(){
    scheduleUpdate();
  },{passive:true});
  updateFromScroll();
})();
