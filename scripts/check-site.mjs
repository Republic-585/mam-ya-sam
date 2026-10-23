#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const selfPath = fileURLToPath(import.meta.url);
const root = resolve(dirname(selfPath), '..');
const failures = [];
let checks = 0;

function check(condition, message) {
  checks += 1;
  if (!condition) failures.push(message);
}

function read(relativePath) {
  const fullPath = join(root, relativePath);
  check(existsSync(fullPath), `Отсутствует обязательный файл: ${relativePath}`);
  return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

function extractBlock(html, openTag, closeTag, label) {
  const start = html.indexOf(openTag);
  check(start !== -1, `${label}: не найден открывающий тег ${openTag.trim()}`);
  if (start === -1) return '';
  const contentStart = start + openTag.length;
  const end = html.indexOf(closeTag, contentStart);
  check(end !== -1, `${label}: не найден закрывающий тег ${closeTag.trim()}`);
  if (end === -1) return '';
  return html.slice(contentStart, end).trim();
}

const index = read('index.html');
const script = read('script.js');
const styles = read('style.css');
const readme = read('README.md');
const privacyStart = index.indexOf('id="privacy-policy"');
const privacyEnd = index.indexOf('</dialog>', privacyStart);
const privacyPolicy = privacyStart !== -1 && privacyEnd > privacyStart ? index.slice(privacyStart, privacyEnd) : '';

check(/<html[^>]*\blang="ru"/i.test(index), 'index.html: не указан lang="ru"');
check(/<meta[^>]+name="viewport"/i.test(index), 'index.html: отсутствует meta viewport');
check(!/rel="stylesheet"[^>]+href="style\.css"/i.test(index), 'index.html: внешний style.css не должен подключаться, стили встроены');
check(!/<script[^>]+src="script\.js"/i.test(index), 'index.html: внешний script.js не должен подключаться, скрипт встроен');
check((index.match(/<style[\s>]/gi) || []).length === 1, 'index.html: должен быть ровно один блок <style>');
check((index.match(/<script(?![^>]*\bsrc=)[^>]*>/gi) || []).length === 1, 'index.html: должен быть ровно один встроенный <script>');

const inlineStyles = extractBlock(index, '<style>\n', '\n</style>', 'index.html <style>');
const inlineScript = extractBlock(index, '<script>\n', '\n</script>', 'index.html <script>');
check(inlineStyles === styles.trim(), 'index.html: встроенные стили разошлись с style.css. Запустите node scripts/sync-assets.mjs');
check(inlineScript === script.trim(), 'index.html: встроенный скрипт разошёлся с script.js. Запустите node scripts/sync-assets.mjs');

const ids = [...index.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = ids.filter((id, position) => ids.indexOf(id) !== position);
check(duplicateIds.length === 0, `index.html: повторяющиеся id: ${[...new Set(duplicateIds)].join(', ')}`);

for (const requiredId of ['signupForm', 'signupStatus', 'selectedPlan', 'consent', 'name', 'email', 'phone', 'comment', 'website', 'privacy-policy', 'parents']) {
  check(ids.includes(requiredId), `index.html: отсутствует элемент с id="${requiredId}"`);
}

for (const field of ['name', 'selectedPlan', 'phone', 'email', 'comment', 'consent', 'website']) {
  check(new RegExp(`<[^>]+name="${field}"`, 'i').test(index), `index.html: в форме отсутствует поле name="${field}"`);
}

check(/<input[^>]+id="name"[^>]*\brequired\b/i.test(index), 'index.html: имя не помечено required');
check(/<input[^>]+id="email"[^>]*\btype="email"[^>]*\brequired\b/i.test(index), 'index.html: email не помечен type="email" required');
check(/<input[^>]+id="consent"[^>]*\btype="checkbox"[^>]*\brequired\b/i.test(index), 'index.html: согласие не помечено required');
for (const [field, limit] of [['name', '100'], ['phone', '32'], ['email', '254'], ['comment', '1000'], ['website', '100']]) {
  check(new RegExp(`<[^>]+id="${field}"[^>]*maxlength="${limit}"`, 'i').test(index), `index.html: у поля ${field} нет maxlength="${limit}"`);
}
check(/<input[^>]+id="phone"[^>]*\binputmode="tel"/i.test(index), 'index.html: у телефона нет inputmode="tel"');
check(/<input[^>]+id="email"[^>]*\bspellcheck="false"/i.test(index), 'index.html: у email не отключена проверка орфографии');
check(/<h1[\s>]/i.test(index) && (index.match(/<h1[\s>]/gi) || []).length === 1, 'index.html: на странице должен быть ровно один h1');
check(!/\son(?:click|submit|load|error|change|input)=/i.test(index), 'index.html: найдены inline-обработчики событий');
check(/<iframe[^>]+title="[^"]+"/i.test(index), 'index.html: у iframe нет title');
const iframeSources = [...index.matchAll(/<iframe[^>]*\bsrc="([^"]+)"/g)].map((match) => match[1]);
check(iframeSources.length === 1 && /^https:\/\/muuvee\.ru\//i.test(iframeSources[0] || ''), 'index.html: неожиданный источник iframe');
check(/<p class="form__privacy">\s*<a[^>]+href="#privacy-policy"/.test(index), 'index.html: рядом с согласием нет ссылки на политику данных');
check(/<h2[^>]*id="privacyHeading"[^>]*>Политика обработки персональных данных<\/h2>/.test(index), 'index.html: отсутствует раздел политики данных');
check(privacyPolicy.includes('https://t.me/mam_ya_sam_bot'), 'index.html: в политике нет контакта для отзыва согласия');
check(privacyPolicy.includes('Google Fonts') && privacyPolicy.includes('Muuvee'), 'index.html: политика не упоминает внешние Google Fonts и Muuvee');
check(/fonts\.googleapis\.com[\s\S]{0,300}fonts\.gstatic\.com/.test(privacyPolicy), 'index.html: политика не перечисляет домены Google Fonts');
check(/не устанавливает собственные cookie/i.test(privacyPolicy), 'index.html: политика не описывает отсутствие собственных cookie и трекеров');
check(/не использует рекламные или аналитические трекеры/i.test(privacyPolicy), 'index.html: политика не описывает отсутствие рекламных и аналитических трекеров');
check(!/шифровани[ея][^<]{0,80}хранени/i.test(privacyPolicy), 'index.html: политика содержит неподтверждённое обещание шифрования при хранении');

check(/class="hero__actions"[\s\S]*?href="#signup"/.test(index), 'index.html: на первом экране нет CTA к форме');
check(/class="hero__lead"/.test(index), 'index.html: на первом экране нет пояснения для родителей');
check(/class="hero__trust"[\s\S]*?5–8 класс[\s\S]*?Telegram или Max/.test(index), 'index.html: на первом экране нет ключевых фактов о курсе');
check(/id="parents"[\s\S]*?<h2 id="parentsHeading">/.test(index), 'index.html: нет блока пользы для родителей');
check(/<summary>С какого класса подойдёт курс\?<\/summary>/.test(index), 'index.html: в FAQ нет ответа про 5–8 класс');
check(/<summary>Нужно ли сразу платить\?<\/summary>/.test(index), 'index.html: в FAQ нет ответа про оплату');
check(/class="video__cta"[\s\S]*?href="#signup"/.test(index), 'index.html: после видео нет CTA к форме');

for (const price of ['490 ₽', '1 290 ₽', '4 490 ₽']) {
  check(index.includes(price), `index.html: пропала цена тарифа ${price}`);
}

const cardPlans = [...index.matchAll(/data-plan-card="([^"]+)"/g)].map((match) => match[1]);
const buttonPlans = [...index.matchAll(/data-plan="([^"]+)"/g)].map((match) => match[1]);
const expectedPlans = ['trial_3d', 'monthly', 'quarterly', 'annual'];
check(JSON.stringify(cardPlans) === JSON.stringify(expectedPlans), `index.html: неожиданные тарифы карточек: ${cardPlans.join(', ')}`);
check(JSON.stringify(buttonPlans) === JSON.stringify(expectedPlans), `index.html: кнопки тарифов не совпадают с карточками: ${buttonPlans.join(', ')}`);

const wireId = script.match(/const TRIAL_PLAN_WIRE_ID = '([^']+)'/)?.[1];
const hiddenPlan = index.match(/id="selectedPlan"[^>]*value="([^"]+)"/)?.[1];
check(Boolean(wireId), 'script.js: не найден TRIAL_PLAN_WIRE_ID');
check(wireId === hiddenPlan, `script.js: TRIAL_PLAN_WIRE_ID (${wireId}) не совпадает со значением формы (${hiddenPlan})`);
check(cardPlans.includes('trial_3d'), 'index.html: пробный тариф должен называться trial_3d');
check(script.includes('trial_3d: {wireId:TRIAL_PLAN_WIRE_ID'), 'script.js: тариф trial_3d не связан с legacy-идентификатором backend');
check(/3\s*(дня|дней)/i.test(index), 'index.html: не найден срок пробного доступа 3 дня');
check(!/7\s*(дней|дня)/i.test(index), 'index.html: осталось упоминание 7-дневного пробного доступа');
check(!/data-plan(?:-card)?="trial_7d"/.test(index), 'index.html: интерфейс всё ещё использует legacy-ключ trial_7d');

const sectionOrder = ['class="problems"', 'class="adult"', 'class="icons"', 'class="steps"', 'class="skill"', 'class="result"', 'class="video"', 'class="parents"', 'class="about"', 'class="format"', 'id="pricing"', 'class="faq"', 'id="signup"'];
let previousSectionPosition = -1;
for (const selector of sectionOrder) {
  const position = index.indexOf(selector);
  check(position > previousSectionPosition, `index.html: нарушена последовательность секций около ${selector}`);
  previousSectionPosition = position;
}

check(!/topbar__cta/.test(index), 'index.html: в шапке осталась отдельная кнопка .topbar__cta');
check(!/topbar__cta/.test(styles), 'style.css: остались стили .topbar__cta');
check(/id="progressText"/.test(index), 'index.html: в шапке нет процента прокрутки');
check(/id="pageProgress"[^>]*role="progressbar"/.test(index), 'index.html: у полосы прогресса нет role="progressbar"');
check(/aria-valuenow="0"/.test(index), 'index.html: у полосы прогресса нет начального aria-valuenow');
check(!/\.topbar__progress-text\s*\{[^}]*display\s*:\s*none/.test(styles), 'style.css: процент прокрутки снова скрыт');
check(script.includes('function getScrollProgress'), 'script.js: нет функции расчёта прогресса');
check(script.includes('ResizeObserver'), 'script.js: прогресс не обновляется при изменении высоты страницы');
check(script.includes("addEventListener('resize'"), 'script.js: прогресс не обновляется при resize');
check(script.includes("addEventListener('scroll'"), 'script.js: прогресс не обновляется при scroll');
check(script.includes('aria-valuenow'), 'script.js: прогресс не обновляет aria-valuenow');

const progressFnSource = script.match(/function getScrollProgress\([\s\S]*?\n\}/)?.[0];
check(Boolean(progressFnSource), 'script.js: не удалось извлечь getScrollProgress для проверки');
if (progressFnSource) {
  const getScrollProgress = new Function(`return (${progressFnSource});`)();
  check(getScrollProgress(0, 2000, 1000) === 0, 'getScrollProgress: верх страницы должен быть 0%');
  check(getScrollProgress(500, 2000, 1000) === 50, 'getScrollProgress: середина должна быть 50%');
  check(getScrollProgress(1000, 2000, 1000) === 100, 'getScrollProgress: низ страницы должен быть 100%');
  check(getScrollProgress(1600, 2000, 1000) === 100, 'getScrollProgress: значение должно ограничиваться 100%');
  check(getScrollProgress(-80, 2000, 1000) === 0, 'getScrollProgress: отрицательный скролл должен ограничиваться 0%');
  check(getScrollProgress(0, 1000, 1000) === 0, 'getScrollProgress: страница без прокрутки должна показывать 0%');
}

check(script.includes('function safeTelegramUrl'), 'script.js: отсутствует проверка Telegram-ссылки');
check(!/window\.location\.href\s*=\s*result\.telegramUrl/.test(script), 'script.js: редирект использует непроверенный result.telegramUrl');
check(/window\.location\.href\s*=\s*telegramUrl/.test(script), 'script.js: нет редиректа по проверенной Telegram-ссылке');
check(/AbortController/.test(script), 'script.js: у запроса формы нет таймаута');
check(/clearTimeout\(timeoutId\)/.test(script), 'script.js: таймаут запроса не очищается');
check(/response\.status === 429/.test(script), 'script.js: нет понятной обработки ограничения частоты запросов');
check(/errorCode === 'please_wait'/.test(script), 'script.js: не обрабатывается ответ please_wait от backend');
check(script.includes("const endpoint = 'https://hvhtbjrecbxlfwmbmaej.supabase.co/functions/v1/signup-request';"), 'script.js: неожиданный endpoint формы');
check(/const publishableKey = 'sb_publishable_[A-Za-z0-9_-]{10,}';/.test(script), 'script.js: не найден ожидаемый публичный publishable key');
check(!/service_role|sb_secret_/.test(script), 'script.js: в клиентском коде найден секретный ключ Supabase');
check(/if \(submitting\) return;/.test(script), 'script.js: нет защиты от повторной отправки формы');
check(/nameInput\.value\.trim\(\)/.test(script), 'script.js: имя не очищается от пробелов перед отправкой');
check(/emailInput\.value\.trim\(\)/.test(script), 'script.js: email не очищается от пробелов перед отправкой');
check(/phone: form\.elements\.phone\.value\.trim\(\)/.test(script), 'script.js: телефон не очищается от пробелов перед отправкой');
check(/comment: form\.elements\.comment\.value\.trim\(\)/.test(script), 'script.js: комментарий не очищается от пробелов перед отправкой');
check(/const startedAt = Date\.now\(\)/.test(script), 'script.js: не передаётся время открытия страницы');
check(/requestTimeoutMs = 15000/.test(script), 'script.js: изменился таймаут запроса формы');
check(!/\beval\s*\(/.test(script), 'script.js: найден eval');
check(!/document\.write\s*\(/.test(script), 'script.js: найден document.write');
check(!/\.innerHTML\s*=/.test(script), 'script.js: найден небезопасный innerHTML');

const telegramFnSource = script.match(/function safeTelegramUrl\(value\) \{[\s\S]*?\n  \}/)?.[0];
check(Boolean(telegramFnSource), 'script.js: не удалось извлечь safeTelegramUrl для проверки');
if (telegramFnSource) {
  const safeTelegramUrl = new Function(`return (${telegramFnSource});`)();
  check(safeTelegramUrl('https://t.me/mam_ya_sam_bot') === 'https://t.me/mam_ya_sam_bot', 'safeTelegramUrl: не принимает корректную ссылку t.me');
  check(safeTelegramUrl('https://telegram.me/mam_ya_sam_bot') === 'https://telegram.me/mam_ya_sam_bot', 'safeTelegramUrl: не принимает корректную ссылку telegram.me');
  check(safeTelegramUrl('http://t.me/mam_ya_sam_bot') === null, 'safeTelegramUrl: пропускает http');
  check(safeTelegramUrl('https://evil.example/mam_ya_sam_bot') === null, 'safeTelegramUrl: пропускает чужой домен');
  check(safeTelegramUrl('https://t.me.evil.example/mam_ya_sam_bot') === null, 'safeTelegramUrl: пропускает поддельный поддомен');
  check(safeTelegramUrl('https://t.me@evil.example/mam_ya_sam_bot') === null, 'safeTelegramUrl: пропускает обход через userinfo');
  check(safeTelegramUrl('not a url') === null, 'safeTelegramUrl: пропускает некорректную строку');
}

const localReferencePattern = /(?:href|src)="([^"]+)"/g;
for (const match of index.matchAll(localReferencePattern)) {
  const value = match[1];
  if (/^(?:https?:|mailto:|tel:|data:|#)/i.test(value)) continue;
  const relative = value.split('#')[0].split('?')[0];
  if (!relative) continue;
  check(existsSync(join(root, relative)), `index.html: битая локальная ссылка ${value}`);
}
check(!/privacy\.html/.test(index), 'index.html: осталась ссылка на несуществующий privacy.html');
check(/node scripts\/check-site\.mjs/.test(readme), 'README.md: не описана команда статических проверок');
check(/node scripts\/sync-assets\.mjs/.test(readme), 'README.md: не описана синхронизация встроенных блоков');

const forbiddenSecrets = [
  /sb_secret_[A-Za-z0-9_-]{12,}/,
  /service_role/i,
  /SUPABASE_SERVICE_ROLE_KEY/,
  /ghp_[A-Za-z0-9]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /AKIA[0-9A-Z]{16}/
];

function walk(directory) {
  for (const entry of readdirSync(directory)) {
    if (entry === '.git' || entry === 'node_modules') continue;
    const fullPath = join(directory, entry);
    const info = statSync(fullPath);
    if (info.isDirectory()) walk(fullPath);
    else if (/\.(?:html|js|mjs|css|md|json|yml|yaml)$/i.test(entry)) {
      if (fullPath === selfPath) continue;
      const contents = readFileSync(fullPath, 'utf8');
      for (const pattern of forbiddenSecrets) {
        check(!pattern.test(contents), `${fullPath.slice(root.length + 1)}: найден похожий на секрет фрагмент (${pattern})`);
      }
    }
  }
}
walk(root);

if (failures.length > 0) {
  console.error(`Проверки не пройдены: ${failures.length} из ${checks}`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`OK: ${checks} проверок пройдено.`);
