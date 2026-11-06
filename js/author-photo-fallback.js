// Резервный источник фотографии автора, если основной файл не загрузился.
(function () {
  const image = document.querySelector('.about-v2__author-photo');
  if (!image) return;

  function useFallbackImage() {
    image.removeEventListener('error', useFallbackImage);
    image.src = 'https://github.com/Republic-585/mam-ya-sam/raw/refs/heads/main/IMG_3511.jpeg';
  }

  image.addEventListener('error', useFallbackImage);
})();
