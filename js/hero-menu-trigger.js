/* Меню главных разделов первого экрана */
(function(){
  const trigger=document.getElementById('heroMenuTrigger');
  const menu=document.getElementById('heroMenu');
  const backdrop=document.getElementById('heroMenuBackdrop');
  if(!trigger||!menu||!backdrop)return;
  /* Backdrop переносим в body, а меню остаётся внутри общей оболочки нижней шапки. */
  document.body.appendChild(backdrop);
  function openMenu(){
    backdrop.hidden=false;
    menu.inert=false;
    menu.setAttribute('aria-hidden','false');
    trigger.setAttribute('aria-expanded','true');
    trigger.setAttribute('aria-label','Закрыть меню');
    document.body.classList.add('hero-menu-open');
    requestAnimationFrame(()=>{backdrop.classList.add('is-open');menu.classList.add('is-open');});
  }
  function closeMenu(){
    backdrop.classList.remove('is-open');
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden','true');
    menu.inert=true;
    trigger.setAttribute('aria-expanded','false');
    trigger.setAttribute('aria-label','Открыть разделы сайта');
    document.body.classList.remove('hero-menu-open');
    window.setTimeout(()=>{if(!menu.classList.contains('is-open'))backdrop.hidden=true;},760);
  }
  trigger.addEventListener('click',()=>menu.classList.contains('is-open')?closeMenu():openMenu());
  backdrop.addEventListener('click',closeMenu);
  menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',event=>{
    const href=link.getAttribute('href')||'';
    if(href.startsWith('#')&&href.length>1){
      const target=document.getElementById(decodeURIComponent(href.slice(1)));
      if(target){
        event.preventDefault();
        closeMenu();
        window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>{
          if(window.history&&window.history.pushState)window.history.pushState(null,'',href);
          target.scrollIntoView({behavior:'smooth',block:'start'});
        }));
        return;
      }
    }
    /* Для внешних ссылок сначала даём браузеру выполнить переход/открыть вкладку. */
    window.setTimeout(closeMenu,0);
  }));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.classList.contains('is-open'))closeMenu();});
})();
