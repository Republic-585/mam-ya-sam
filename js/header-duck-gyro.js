(function(){
  const duck=document.getElementById('headerDuck');
  if(!duck)return;

  let listening=false,permissionGranted=false,frame=0,currentX=0,targetX=0,velocityX=0,baseline=null,lastFrameTime=0;
  let minX=-34,maxX=34;
  function clamp(v,min,max){return Math.min(max,Math.max(min,v));}

  function measureSwimArea(){
    const inner=duck.parentElement;
    const cube=inner&&inner.querySelector('.logo__dot');
    const menu=inner&&inner.querySelector('.hero__menu-trigger');
    if(!inner||!cube||!menu)return;
    const parentRect=inner.getBoundingClientRect();
    const cubeRect=cube.getBoundingClientRect();
    const menuRect=menu.getBoundingClientRect();
    const baseLeft=duck.offsetLeft;
    minX=cubeRect.right-parentRect.left+5-baseLeft;
    maxX=menuRect.left-parentRect.left-5-(baseLeft+duck.offsetWidth);
    if(maxX<minX){minX=maxX=0;}
    targetX=clamp(targetX,minX,maxX);
    currentX=clamp(currentX,minX,maxX);
    duck.style.setProperty('--duck-x',currentX.toFixed(2)+'px');
  }
  measureSwimArea();
  window.addEventListener('resize',measureSwimArea,{passive:true});

  function animate(timestamp){
    const dt=lastFrameTime?Math.min((timestamp-lastFrameTime)/1000,0.032):0.016;
    lastFrameTime=timestamp;
    // Пружинная физика: утка мягко разгоняется, чуть перелетает цель и естественно успокаивается.
    const stiffness=12;
    const damping=7.2;
    const acceleration=(targetX-currentX)*stiffness-velocityX*damping;
    velocityX+=acceleration*dt;
    currentX+=velocityX*dt;

    const distance=targetX-currentX;
    if(Math.abs(distance)<0.18&&Math.abs(velocityX)<1.2){
      currentX=targetX;
      velocityX=0;
    }
    duck.style.setProperty('--duck-x',currentX.toFixed(2)+'px');
    duck.style.setProperty('--duck-lean',clamp(-velocityX*0.035,-3,3).toFixed(2)+'deg');

    if(Math.abs(targetX-currentX)>0.18||Math.abs(velocityX)>1.2){
      frame=requestAnimationFrame(animate);
    }else{
      frame=0;
      lastFrameTime=0;
      duck.style.setProperty('--duck-lean','0deg');
    }
  }

  function onOrientation(event){
    if(typeof event.gamma!=='number'||!Number.isFinite(event.gamma))return;
    if(baseline===null){baseline=event.gamma;return;}
    const rawTilt=clamp((event.gamma-baseline)/28,-1,1);
    // Мягкая стартовая зона: небольшие наклоны не разгоняют утку резко.
    const deadZone=0.06;
    const softenedMagnitude=Math.max(0,(Math.abs(rawTilt)-deadZone)/(1-deadZone));
    const tilt=Math.sign(rawTilt)*Math.pow(softenedMagnitude,1.7);
    duck.style.setProperty('--duck-direction',tilt>0.025?'-1':'1');
    targetX=minX+(tilt+1)*0.5*(maxX-minX);
    if(!frame)frame=requestAnimationFrame(animate);
  }

  function start(){
    if(listening)return;
    listening=true;
    baseline=null;
    window.addEventListener('deviceorientation',onOrientation,true);
    duck.setAttribute('aria-label','Остановить движение утки');
  }

  function stop(){
    if(!listening)return;
    listening=false;
    window.removeEventListener('deviceorientation',onOrientation,true);
    if(frame)cancelAnimationFrame(frame);
    frame=0;
    baseline=null;
    duck.setAttribute('aria-label','Запустить движение утки');
  }

  function toggleMovement(event){
    if(event&&event.isTrusted===false)return;
    if(listening){stop();return;}
    const API=window.DeviceOrientationEvent;
    if(!API){start();return;}
    if(permissionGranted){start();return;}
    if(typeof API.requestPermission==='function'){
      // iOS требует вызова запроса разрешения непосредственно из жеста пользователя.
      let result;
      try{result=API.requestPermission();}catch(error){return;}
      result.then(function(state){
        if(state==='granted'){permissionGranted=true;start();}
      }).catch(function(){});
    }else{
      permissionGranted=true;
      start();
    }
  }

  duck.setAttribute('role','button');
  duck.setAttribute('tabindex','0');
  duck.setAttribute('aria-label','Запустить движение утки');
  duck.addEventListener('click',toggleMovement);
  duck.addEventListener('keydown',function(event){
    if(event.key==='Enter'||event.key===' '){
      event.preventDefault();
      toggleMovement(event);
    }
  });

  // Автозапуск в браузерах, где датчик не требует отдельного разрешения.
  // На iOS оставляем запуск по нажатию, чтобы запрос разрешения был вызван
  // непосредственно пользовательским действием.
  const API=window.DeviceOrientationEvent;
  if(API && typeof API.requestPermission!=='function'){
    permissionGranted=true;
    start();
  }
})();
