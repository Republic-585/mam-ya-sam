
(function(){
  const button=document.getElementById('themeToggle');
  if(!button)return;
  let dark=false;
  try{dark=localStorage.getItem('mamYaSamTheme')==='dark';}catch(_){}
  function applyTheme(){
    document.body.classList.toggle('theme-dark',dark);
    button.setAttribute('aria-pressed',String(dark));
    button.setAttribute('aria-label',dark?'Включить светлую тему':'Включить тёмную тему');
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute('content',dark?'#101522':'#080d20');
  }
  button.addEventListener('click',function(){
    dark=!dark;applyTheme();
    try{localStorage.setItem('mamYaSamTheme',dark?'dark':'light');}catch(_){}
  });
  applyTheme();
})();
