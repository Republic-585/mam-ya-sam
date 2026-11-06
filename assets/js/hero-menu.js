
/* Меню главных разделов первого экрана */
(function(){
  const trigger=document.getElementById('heroMenuTrigger');
  const menu=document.getElementById('heroMenu');
  const backdrop=document.getElementById('heroMenuBackdrop');
  if(!trigger||!menu||!backdrop)return;
  /* Выносим фиксированные слои меню из hero: так их не ограничивают stacking context и transform секций. */
  document.body.appendChild(backdrop);
  document.body.appendChild(menu);
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
    window.setTimeout(()=>{if(!menu.classList.contains('is-open'))backdrop.hidden=true;},390);
  }
  trigger.addEventListener('click',()=>menu.classList.contains('is-open')?closeMenu():openMenu());
  backdrop.addEventListener('click',closeMenu);
  menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.classList.contains('is-open'))closeMenu();});
})();
