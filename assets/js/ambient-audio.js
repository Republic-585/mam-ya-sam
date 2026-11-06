
/* Тихая фоновая музыка: запускается только нажатием на стрелки первого экрана. */
(function () {
  const audio = document.getElementById('ambient-audio');
  const trigger = document.querySelector('.hero__cta');
  if (!audio || !trigger) return;

  let context = null;
  let source = null;
  let gain = null;
  let loading = false;
  let started = false;
  let decodedBuffer = null;

  async function startAudio() {
    if (started || loading) return;
    loading = true;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error('Web Audio API не поддерживается этим браузером');

      if (!context) context = new AudioContextClass();
      await context.resume();

      if (!decodedBuffer) {
        const response = await fetch('https://raw.githubusercontent.com/Republic-585/mam-ya-sam/main/audio.mp3', { cache: 'force-cache' });
        if (!response.ok) throw new Error('Не удалось загрузить MP3: HTTP ' + response.status);
        const data = await response.arrayBuffer();
        decodedBuffer = await context.decodeAudioData(data);
      }

      source = context.createBufferSource();
      source.buffer = decodedBuffer;
      source.loop = true;

      // Низкая громкость и плавное нарастание уровня предотвращают резкий старт.
      gain = context.createGain();
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, context.currentTime + 2.5);

      source.connect(gain);
      gain.connect(context.destination);
      source.start(0);
      started = true;
    } catch (error) {
      console.warn('Не удалось запустить фоновое аудио:', error);
    } finally {
      loading = false;
    }
  }

  // iOS Safari may suspend Web Audio while the browser is in the background.
  // Resume only if the visitor has already started the music manually.
  async function resumeAudio() {
    if (!started || !context || document.visibilityState === 'hidden') return;
    if (context.state !== 'running') {
      try {
        await context.resume();
      } catch (error) {
        console.warn('Не удалось возобновить фоновое аудио:', error);
      }
    }
  }

  document.addEventListener('visibilitychange', resumeAudio);
  window.addEventListener('pageshow', resumeAudio);
  window.addEventListener('focus', resumeAudio);
  trigger.addEventListener('click', startAudio);
})();
