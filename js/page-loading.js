/* Не показываем промежуточное состояние страницы до разбора актуальной разметки. */
document.documentElement.classList.add('page-loading');
document.addEventListener('DOMContentLoaded', function () {
  document.documentElement.classList.remove('page-loading');
}, { once: true });
