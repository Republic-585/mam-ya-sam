  (function(){
    const player=document.getElementById('videoPlayer');
    const video=document.getElementById('practiceVideo');
    if(!player||!video)return;
    const play=player.querySelector('.video__play');
    const toggle=player.querySelector('.video__toggle');
    const seek=player.querySelector('.video__seek');
    const current=player.querySelector('.video__current-time');
    const duration=player.querySelector('.video__duration');
    const mute=player.querySelector('.video__mute');
    const fullscreen=player.querySelector('.video__fullscreen');
    const quality=player.querySelector('.video__quality');
    const qualitySources={
      '1080':'https://videos.pexels.com/video-files/7749296/7749296-hd_1920_1080_30fps.mp4',
      '720':'https://videos.pexels.com/video-files/7749296/7749296-hd_1280_720_30fps.mp4',
      '480':'https://videos.pexels.com/video-files/7749296/7749296-sd_960_540_30fps.mp4'
    };
    /* Нативный loop браузера повторяет весь короткий ролик без ручной перемотки. */
    let inView=false;
    let previewing=false;
    let userMode=false;
    let userMuted=false;
    let seekFrame=0;
    let isSeeking=false;

    /* Начинаем загрузку заранее, пока плеер ещё находится ниже видимой области. */
    if('IntersectionObserver' in window){
      const preloadObserver=new IntersectionObserver(entries=>{
        if(entries.some(entry=>entry.isIntersecting)){
          video.preload='auto';
          video.load();
          preloadObserver.disconnect();
        }
      },{rootMargin:'1800px 0px',threshold:0});
      preloadObserver.observe(player);
    }else{
      video.preload='auto';
      video.load();
    }

    function renderSeek(){
      if(video.duration&&!isSeeking){
        const p=Math.max(0,Math.min(1,video.currentTime/video.duration));
        seek.value=Math.round(p*1000);
        seek.style.setProperty('--seek-progress',(p*100)+'%');
      }
      if(!video.paused&&!video.ended){
        seekFrame=requestAnimationFrame(renderSeek);
      }else{
        seekFrame=0;
      }
    }
    function startSeekAnimation(){
      if(!seekFrame)seekFrame=requestAnimationFrame(renderSeek);
    }
    function stopSeekAnimation(){
      if(seekFrame){cancelAnimationFrame(seekFrame);seekFrame=0;}
      renderSeek();
    }
    const pad=n=>String(Math.floor(n||0)).padStart(2,'0');
    const time=t=>pad(t/60)+':'+pad(t%60);

    function updatePlay(){
      player.classList.toggle('is-playing',userMode&&!video.paused);
      const playing=userMode&&!video.paused;
      toggle.setAttribute('aria-label',playing?'Пауза':'Воспроизвести');
      play.setAttribute('aria-label',playing?'Пауза':'Воспроизвести видео');
    }
    function startPreview(){
      if(userMode||previewing||!video.paused||!video.readyState)return;
      previewing=true;
      player.classList.add('is-previewing');
      video.loop=true;
      video.muted=true;
      video.currentTime=0;
      video.play().catch(()=>{previewing=false;player.classList.remove('is-previewing');});
    }
    function stopPreview(reset){
      if(!previewing)return;
      previewing=false;
      player.classList.remove('is-previewing');
      video.pause();
      if(reset&&video.readyState>=1){
        try{video.currentTime=0;}catch(e){}
      }
    }
    let controlsHideTimer=null;
    function showControls(){
      player.classList.remove('is-controls-hidden');
      if(controlsHideTimer){clearTimeout(controlsHideTimer);controlsHideTimer=null;}
      if(userMode&&!video.paused){
        controlsHideTimer=setTimeout(function(){
          if(userMode&&!video.paused)player.classList.add('is-controls-hidden');
        },2600);
      }
    }
    function togglePlay(){
      if(userMode&&!video.paused){
        video.pause();
        userMode=true;
        previewing=false;
        showControls();
        updatePlay();
        return;
      }
      stopPreview(false);
      userMode=true;
      video.loop=false;
      video.muted=userMuted;
      video.play().catch(()=>{userMode=false;showControls();updatePlay();});
      updatePlay();
      showControls();
    }
    play.addEventListener('click',togglePlay);
    toggle.addEventListener('click',togglePlay);
    player.addEventListener('pointermove',function(){
      if(userMode&&!video.paused)showControls();
    });
    player.addEventListener('pointerdown',function(event){
      if(event.target.closest('.video__controls'))showControls();
    });
    let videoClickTimer=null;
    let seekFeedbackTimer=null;
    const seekFeedback=document.createElement('div');
    seekFeedback.className='video__seek-feedback';
    seekFeedback.setAttribute('aria-hidden','true');
    seekFeedback.innerHTML='<span class="video__seek-feedback-icon"><svg viewBox="0 0 48 48"><path d="M20 14 9 24l11 10M10 24h18a10 10 0 0 1 10 10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="m22 17-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="video__seek-feedback-label">−10 сек</span>';
    const seekFeedbackRight=document.createElement('div');
    seekFeedbackRight.className='video__seek-feedback video__seek-feedback--right';
    seekFeedbackRight.setAttribute('aria-hidden','true');
    seekFeedbackRight.innerHTML='<span class="video__seek-feedback-icon"><svg viewBox="0 0 48 48"><path d="m28 14 11 10-11 10M38 24H20a10 10 0 0 0-10 10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="m26 17 7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="video__seek-feedback-label">+10 сек</span>';
    player.append(seekFeedback,seekFeedbackRight);
    function seekBy(seconds){
      if(!Number.isFinite(video.duration)||!video.duration)return;
      stopPreview(false);
      userMode=true;
      video.muted=userMuted;
      video.currentTime=Math.max(0,Math.min(video.duration,video.currentTime+seconds));
      updatePlay();
      if(!video.paused)startSeekAnimation();
      const feedback=seconds<0?seekFeedback:seekFeedbackRight;
      seekFeedback.classList.remove('is-visible');
      seekFeedbackRight.classList.remove('is-visible');
      feedback.classList.remove('is-visible');
      void feedback.offsetWidth;
      feedback.classList.add('is-visible');
      if(seekFeedbackTimer)clearTimeout(seekFeedbackTimer);
      seekFeedbackTimer=setTimeout(()=>{
        seekFeedback.classList.remove('is-visible');
        seekFeedbackRight.classList.remove('is-visible');
      },650);
    }
    player.addEventListener('click',function(event){
      if(event.target.closest('.video__controls,.video__play,.video__seek-feedback'))return;
      if(videoClickTimer){
        clearTimeout(videoClickTimer);
        videoClickTimer=null;
        const rect=player.getBoundingClientRect();
        seekBy(event.clientX<rect.left+rect.width/2?-10:10);
      }else{
        videoClickTimer=setTimeout(function(){
          videoClickTimer=null;
          if(player.classList.contains('is-controls-hidden')){
            showControls();
          }else{
            player.classList.add('is-controls-hidden');
            if(controlsHideTimer){clearTimeout(controlsHideTimer);controlsHideTimer=null;}
          }
        },280);
      }
    });
    video.addEventListener('play',function(){
      updatePlay();
      startSeekAnimation();
      if(userMode)showControls();
    });
    video.addEventListener('pause',function(){
      if(userMode)showControls();
      updatePlay();
      stopSeekAnimation();
    });
    video.addEventListener('ended',function(){
      if(userMode){userMode=false;updatePlay();}
    });
    video.addEventListener('loadedmetadata',function(){
      duration.textContent=time(video.duration);
      player.querySelector('.video__preview-duration').textContent=time(video.duration);
      seek.max=1000;
      if(inView&&!userMode)startPreview();
    });
    /* Запускаем превью сразу после готовности кадров, а не ждём повторного пересечения блока. */
    video.addEventListener('canplay',function(){
      if(inView&&!userMode)startPreview();
    });
    video.addEventListener('timeupdate',function(){
      current.textContent=time(video.currentTime);
      if(video.paused&&!isSeeking)renderSeek();
    });
    seek.addEventListener('pointerdown',function(){
      isSeeking=true;
      stopPreview(false);
      userMode=true;
      player.classList.add('is-seeking');
      video.muted=userMuted;
      showControls();
    });
    function finishSeeking(){
      isSeeking=false;
      player.classList.remove('is-seeking');
      renderSeek();
      updatePlay();
      if(!video.paused)startSeekAnimation();
    }
    seek.addEventListener('pointerup',finishSeeking);
    seek.addEventListener('pointercancel',finishSeeking);
    seek.addEventListener('input',function(){
      const p=Number(seek.value)/1000;
      seek.style.setProperty('--seek-progress',(p*100)+'%');
      if(video.duration){
        video.currentTime=p*video.duration;
        current.textContent=time(video.currentTime);
      }
    });
    seek.addEventListener('change',function(){
      if(video.duration){
        stopPreview(false);
        userMode=true;
        video.currentTime=(Number(seek.value)/1000)*video.duration;
      }
      finishSeeking();
    });
    mute.addEventListener('click',function(){
      userMuted=!video.muted;
      video.muted=userMuted;
      mute.setAttribute('aria-label',userMuted?'Включить звук':'Выключить звук');
      mute.classList.toggle('is-muted',userMuted);
      mute.style.opacity=userMuted?'.55':'1';
    });
    fullscreen.addEventListener('click',function(){
      if(document.fullscreenElement)document.exitFullscreen?.();
      else if(player.requestFullscreen)player.requestFullscreen();
      else if(video.webkitEnterFullscreen)video.webkitEnterFullscreen();
    });
    quality.addEventListener('change',function(){
      const wasPlaying=!video.paused;
      const wasPreview=previewing;
      const position=video.currentTime||0;
      previewing=false;
      player.classList.remove('is-previewing');
      video.pause();
      video.src=qualitySources[quality.value];
      video.load();
      video.addEventListener('loadedmetadata',function restore(){
        video.removeEventListener('loadedmetadata',restore);
        if(wasPreview&&!userMode){startPreview();return;}
        video.currentTime=Math.min(position,video.duration||position);
        if(wasPlaying)video.play().catch(()=>{});
      });
    });

    if('IntersectionObserver' in window){
      const observer=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          inView=entry.isIntersecting&&entry.intersectionRatio>=0.35;
          /* Видимость запускает превью один раз; прокрутка больше не останавливает его. */
          if(inView&&!userMode)startPreview();
        });
      },{threshold:[0,0.35,0.6]});
      observer.observe(player);
    }else{
      inView=true;
      video.addEventListener('loadeddata',startPreview,{once:true});
    }
    updatePlay();
  })();
  