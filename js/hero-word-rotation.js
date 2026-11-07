(function(){
  function initHeroWordRotation(){
    const pill=document.getElementById('hero-rotating-verb-pill');
    if(!pill || pill.dataset.rotationReady) return;
    pill.dataset.rotationReady='true';
    const words=[
      {text:'думают',color:'#007AFF',bg:'#E5F1FF'},
      {text:'создают',color:'#34C759',bg:'#E5F7EA'},
      {text:'строят',color:'#FF9500',bg:'#FFF1DB'},
      {text:'решают',color:'#AF52DE',bg:'#F3E8FA'},
      {text:'развивают',color:'#FF2D55',bg:'#FFE8ED'},
      {text:'созидают',color:'#D69E00',bg:'#FFF5CC'}
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
