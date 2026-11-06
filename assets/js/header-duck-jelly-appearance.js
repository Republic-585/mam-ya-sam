
(function(){
  const duck=document.getElementById('headerDuck');
  if(!duck)return;
  let visible=false,frame=0;
  function checkAppearance(){
    frame=0;
    const opacity=parseFloat(getComputedStyle(duck).opacity)||0;
    const nowVisible=opacity>.12;
    if(nowVisible&&!visible){
      duck.classList.remove('is-intro-jelly');
      void duck.offsetWidth;
      duck.classList.add('is-intro-jelly');
    }else if(!nowVisible&&visible){
      duck.classList.remove('is-intro-jelly');
    }
    visible=nowVisible;
  }
  function onScroll(){
    if(!frame)frame=requestAnimationFrame(checkAppearance);
  }
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll,{passive:true});
  checkAppearance();
})();
