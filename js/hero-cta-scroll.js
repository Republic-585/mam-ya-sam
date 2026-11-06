// Плавный переход от главной кнопки к тарифам.
(function () {
  const button = document.querySelector('.hero-start-button');
  if (!button) return;

  button.addEventListener('click', function (event) {
    event.preventDefault();
    const target = document.getElementById('pricing');
    if (target) {
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY,
        behavior: 'smooth'
      });
    }
  });
})();
