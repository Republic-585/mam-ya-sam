#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
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
const checksWorkflow = read('.github/workflows/checks.yml');
const pagesWorkflow = read('.github/workflows/pages.yml');
const opencodeWorkflow = read('.github/workflows/opencode.yml');

check(/<html[^>]*\blang="ru"/i.test(index), 'index.html: не указан lang="ru"');
check(/<meta[^>]+name="viewport"/i.test(index), 'index.html: отсутствует meta viewport');
check(/<meta[^>]+name="referrer"[^>]+strict-origin-when-cross-origin/i.test(index), 'index.html: нет безопасной политики referrer');

const csp = index.match(/<meta[^>]+http-equiv="Content-Security-Policy"[^>]+content="([^"]+)"/i)?.[1] || '';
check(Boolean(csp), 'index.html: отсутствует Content-Security-Policy');
check(/default-src 'self'/.test(csp), 'CSP: default-src должен ограничиваться self');
check(/object-src 'none'/.test(csp), 'CSP: object-src должен быть запрещён');
check(/base-uri 'self'/.test(csp), 'CSP: base-uri должен ограничиваться self');
check(/form-action 'self'/.test(csp), 'CSP: form-action должен ограничиваться self');
check(/script-src [^;]*'unsafe-inline'/.test(csp), 'CSP: встроенный скрипт должен быть явно разрешён');
check(/connect-src [^;]*https:\/\/hvhtbjrecbxlfwmbmaej\.supabase\.co/.test(csp), 'CSP: не разрешён Supabase Edge Function');
check(/frame-src [^;]*https:\/\/muuvee\.ru/.test(csp), 'CSP: не разрешён iframe Muuvee');
check(/style-src [^;]*https:\/\/fonts\.googleapis\.com/.test(csp), 'CSP: не разрешён stylesheet Google Fonts');
check(/font-src [^;]*https:\/\/fonts\.gstatic\.com/.test(csp), 'CSP: не разрешены файлы Google Fonts');
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
check(/<form[^>]*\bid="signupForm"[^>]*\bmethod="post"/i.test(index), 'index.html: форма должна использовать method="post", чтобы данные не попадали в URL при отключённом JS');
check(!/<form[^>]*\bid="signupForm"[^>]*\bmethod="get"/i.test(index), 'index.html: форма не должна отправлять персональные данные методом GET');
check(/<noscript>[\s\S]*?https:\/\/t\.me\/mam_ya_sam_bot[\s\S]*?<\/noscript>/.test(index), 'index.html: нет резервного сообщения для пользователей без JavaScript');
check(/<iframe[^>]+title="[^"]+"/i.test(index), 'index.html: у iframe нет title');
check(/<p class="form__privacy">\s*<a[^>]+href="#privacy-policy"/.test(index), 'index.html: рядом с согласием нет ссылки на политику данных');
check(/<h2[^>]*id="privacyHeading"[^>]*>Политика обработки персональных данных<\/h2>/.test(index), 'index.html: отсутствует раздел политики данных');
check(index.includes('https://t.me/mam_ya_sam_bot'), 'index.html: в политике нет контакта для отзыва согласия');

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

const allowedWireIdsSource = script.match(/const ALLOWED_PLAN_WIRE_IDS = Object\.freeze\(\[([^\]]+)\]\)/)?.[1] || '';
const allowedWireIds = (allowedWireIdsSource.match(/'([^']+)'/g) || []).map((item) => item.slice(1, -1));
if (/TRIAL_PLAN_WIRE_ID/.test(allowedWireIdsSource)) allowedWireIds.unshift(wireId);
check(JSON.stringify(allowedWireIds) === JSON.stringify(['trial_7d', 'monthly', 'quarterly', 'annual']), `script.js: неожиданный список разрешённых backend-тарифов: ${allowedWireIds.join(', ')}`);
check(script.includes('function normalizePlanWireId(value)'), 'script.js: нет нормализации тарифа перед отправкой');
const normalizeWireSource = script.match(/function normalizePlanWireId\(value\) \{[\s\S]*?\n\}/)?.[0];
check(Boolean(normalizeWireSource), 'script.js: не удалось извлечь normalizePlanWireId для проверки');
if (normalizeWireSource) {
  const normalizePlanWireId = new Function('ALLOWED_PLAN_WIRE_IDS', 'TRIAL_PLAN_WIRE_ID', `return (${normalizeWireSource});`)(Object.freeze(allowedWireIds), wireId);
  check(normalizePlanWireId('monthly') === 'monthly', 'normalizePlanWireId: не пропускает monthly');
  check(normalizePlanWireId('quarterly') === 'quarterly', 'normalizePlanWireId: не пропускает quarterly');
  check(normalizePlanWireId('annual') === 'annual', 'normalizePlanWireId: не пропускает annual');
  check(normalizePlanWireId('trial_3d') === wireId, 'normalizePlanWireId: интерфейсный trial_3d должен превращаться в backend-идентификатор');
  check(normalizePlanWireId('подделка') === wireId, 'normalizePlanWireId: неизвестный тариф должен сводиться к trial');
}
for (const [plan, backendId] of [['monthly', 'monthly'], ['quarterly', 'quarterly'], ['annual', 'annual']]) {
  check(new RegExp(`${plan}: \\{wireId:'${backendId}'`).test(script), `script.js: тариф ${plan} не связан с backend-идентификатором ${backendId}`);
}
check(script.includes('setCustomValidity'), 'script.js: нет проверки имени/email после trim');
check(/let submitting = false/.test(script), 'script.js: нет защиты от повторной отправки формы');
check(/response\.status === 429/.test(script), 'script.js: нет отдельного сообщения при rate limit 429');

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

for (const match of index.matchAll(/(?:href|src)="(http:\/\/[^"]+)"/g)) {
  check(false, `index.html: небезопасная http-ссылка ${match[1]}`);
}
for (const match of index.matchAll(/<a\b[^>]*\btarget="_blank"[^>]*>/gi)) {
  check(/\brel="[^"]*noopener/i.test(match[0]), `index.html: ссылка target="_blank" без rel="noopener": ${match[0].slice(0, 120)}`);
}

check(/name:\s*Site checks/.test(checksWorkflow), '.github/workflows/checks.yml: не найден workflow проверок');
check(/\bpull_request:/.test(checksWorkflow), '.github/workflows/checks.yml: проверки не запускаются на pull request');
check(/node --check script\.js/.test(checksWorkflow), '.github/workflows/checks.yml: нет проверки синтаксиса script.js');
check(/node scripts\/check-site\.mjs/.test(checksWorkflow), '.github/workflows/checks.yml: нет статических проверок сайта');
check(/node --check script\.js/.test(pagesWorkflow), '.github/workflows/pages.yml: публикация не проверяет синтаксис script.js');
check(/node scripts\/check-site\.mjs/.test(pagesWorkflow), '.github/workflows/pages.yml: публикация не запускает статические проверки');
check(!/gh pr merge/.test(opencodeWorkflow), '.github/workflows/opencode.yml: maintenance-workflow не должен автоматически сливать PR');
check(/OpenCode maintenance proposal/.test(opencodeWorkflow), '.github/workflows/opencode.yml: PR должен явно называться предложением обслуживания');
check(/\.github\/workflows\/checks\.yml/.test(readme), 'README.md: не описан workflow проверок');
check(/Content-Security-Policy|CSP/i.test(readme), 'README.md: не описана политика Content-Security-Policy');
check(/method="post"/i.test(readme), 'README.md: не описан fallback формы без JavaScript');

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
      if (fullPath === new URL(import.meta.url).pathname) continue;
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
