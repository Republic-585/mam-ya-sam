(function(){
  const duck=document.getElementById('headerDuck');
  const svg=duck&&duck.querySelector('svg');
  if(!duck||!svg||typeof svg.animate!=='function')return;
  duck.addEventListener('click',function(){
    if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    svg.animate([
      {scale:'1',offset:0},
      {scale:'1.09 .93',offset:.18},
      {scale:'.95 1.05',offset:.38},
      {scale:'1.035 .975',offset:.58},
      {scale:'.985 1.015',offset:.78},
      {scale:'1.005 .998',offset:.92},
      {scale:'1',offset:1}
    ],{
      duration:980,
      easing:'cubic-bezier(.22,.7,.25,1)',
      fill:'none'
    });
  });
})();