
(function(){
  function initHeroWordRotation(){
    const pill=document.getElementById('hero-rotating-verb-pill');
    if(!pill || pill.dataset.rotationReady) return;
    pill.dataset.rotationReady='true';
    const words=[
      {text:'Думают',color:'#3984F7',bg:'#D9E9FF'},
      {text:'Создают',color:'#20A779',bg:'#CFF3E5'},
      {text:'Строят',color:'#E7A126',bg:'#FFE9B8'},
      {text:'Решают',color:'#8B65D8',bg:'#E8DFFF'},
      {text:'Развивают',color:'#E87545',bg:'#FFDCCF'},
      {text:'Созидают',color:'#D94F87',bg:'#F9D5E5'}
    ];
    let index=0;
    function applyWord(){
      const word=words[index];
      pill.textContent=word.text;
      pill.style.backgroundColor=word.bg;
      pill.style.setProperty('--hero-word-color',word.color);
      pill.style.color='#000000';
      pill.setAttribute('aria-label',word.text);
    }
    function nextWord(){
      index=(index+1)%words.length;
      pill.classList.remove('is-changing');
      applyWord();
      void pill.offsetWidth;
      pill.classList.add('is-changing');
    }
    applyWord();
    window.setInterval(nextWord,2200);
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',initHeroWordRotation,{once:true});
  }else{
    initHeroWordRotation();
  }
})();
