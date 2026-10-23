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

check(/<html[^>]*\blang="ru"/i.test(index), 'index.html: не указан lang="ru"');
check(/<meta[^>]+name="viewport"/i.test(index), 'index.html: отсутствует meta viewport');
check(/<meta[^>]+name="referrer"[^>]+content="strict-origin-when-cross-origin"/i.test(index), 'index.html: отсутствует безопасная политика referrer');
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

for (const requiredId of ['signupForm', 'signupStatus', 'selectedPlan', 'consent', 'name', 'email', 'phone', 'comment', 'website', 'privacy-policy']) {
  check(ids.includes(requiredId), `index.html: отсутствует элемент с id="${requiredId}"`);
}

for (const field of ['name', 'selectedPlan', 'phone', 'email', 'comment', 'consent', 'website']) {
  check(new RegExp(`<[^>]+name="${field}"`, 'i').test(index), `index.html: в форме отсутствует поле name="${field}"`);
}

const signupFormTag = index.match(/<form[^>]*\bid="signupForm"[^>]*>/i)?.[0] || '';
check(Boolean(signupFormTag), 'index.html: не найден тег формы signupForm');
check(/\bmethod="post"/i.test(signupFormTag), 'index.html: форма должна отправляться методом post, чтобы данные не попадали в URL при отключённом JS');
check(!/\bnovalidate\b/i.test(signupFormTag), 'index.html: нельзя отключать нативную валидацию формы');

check(/<input[^>]+id="name"[^>]*\brequired\b/i.test(index), 'index.html: имя не помечено required');
check(/<input[^>]+id="email"[^>]*\btype="email"[^>]*\brequired\b/i.test(index), 'index.html: email не помечен type="email" required');
check(/<input[^>]+id="consent"[^>]*\btype="checkbox"[^>]*\brequired\b/i.test(index), 'index.html: согласие не помечено required');
check(/<iframe[^>]+title="[^"]+"/i.test(index), 'index.html: у iframe нет title');
check(/<p class="form__privacy"><a href="#privacy-policy">/.test(index), 'index.html: рядом с согласием нет ссылки на политику данных');
check(/<h2 id="privacyHeading">Политика обработки персональных данных<\/h2>/.test(index), 'index.html: отсутствует раздел политики данных');
check(index.includes('https://t.me/mam_ya_sam_bot'), 'index.html: в политике нет контакта для отзыва согласия');

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

check(script.includes('function safeTelegramUrl'), 'script.js: отсутствует проверка Telegram-ссылки');
check(!/window\.location\.href\s*=\s*result\.telegramUrl/.test(script), 'script.js: редирект использует непроверенный result.telegramUrl');
check(/window\.location\.href\s*=\s*telegramUrl/.test(script), 'script.js: нет редиректа по проверенной Telegram-ссылке');
check(/AbortController/.test(script), 'script.js: у запроса формы нет таймаута');
check(/clearTimeout\(timeoutId\)/.test(script), 'script.js: таймаут запроса не очищается');
check(/class SignupError extends Error/.test(script), 'script.js: нет отдельного типа пользовательских ошибок формы');
check(/error instanceof SignupError/.test(script), 'script.js: технические ошибки могут показываться пользователю вместо русского текста');
check(/let submitting = false/.test(script), 'script.js: нет защиты от повторной отправки формы');
check(/form\.setAttribute\('aria-busy', 'true'\)/.test(script), 'script.js: форма не сообщает о состоянии отправки через aria-busy');

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
  check(safeTelegramUrl('https://user:pass@t.me/mam_ya_sam_bot') === null, 'safeTelegramUrl: пропускает логин или пароль в URL');
  check(safeTelegramUrl('https://t.me:8443/mam_ya_sam_bot') === null, 'safeTelegramUrl: пропускает нестандартный порт');
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
