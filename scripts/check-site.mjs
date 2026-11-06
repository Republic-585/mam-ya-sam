#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const failures = [];
let checks = 0;

function check(condition, message) {
  checks += 1;
  if (!condition) failures.push(message);
}

function read(path) {
  const fullPath = join(root, path);
  check(existsSync(fullPath), `Отсутствует файл: ${path}`);
  return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

const html = read('index.html');
const workflow = read('.github/workflows/pages.yml');

const stylesheetLinks = [...html.matchAll(/<link\b[^>]*>/gi)]
  .map(([tag]) => tag)
  .filter((tag) => /\brel=["']stylesheet["']/i.test(tag))
  .map((tag) => tag.match(/\bhref=["']([^"']+)["']/i)?.[1])
  .filter(Boolean);

check(stylesheetLinks.length > 0, 'Не найдены подключения CSS-таблиц стилей');

for (const href of stylesheetLinks) {
  if (/^(?:https?:|data:|\/\/)/i.test(href)) continue;
  const relative = href.split(/[?#]/)[0];
  check(relative.toLowerCase().endsWith('.css'), `Подключённый stylesheet не является CSS-файлом: ${href}`);
  check(existsSync(resolve(root, relative)), `Не найден подключённый CSS-файл: ${href}`);
}

check(
  workflow.includes('cp ./*.css _site/'),
  'GitHub Pages workflow не копирует CSS-файлы в публикуемый каталог _site'
);

for (const asset of ['favicon.svg', 'audio.mp3', 'IMG_3511.jpeg']) {
  const fullPath = join(root, asset);
  check(existsSync(fullPath) && statSync(fullPath).size > 0, `Отсутствует или пустой ресурс: ${asset}`);
}

check(/<html[^>]*\blang=["']ru["']/i.test(html), 'Не указан язык страницы lang="ru"');
check(/<meta[^>]+name=["']viewport["']/i.test(html), 'Отсутствует meta viewport');
check(/rel=["']icon["'][^>]+href=["']favicon\.svg(?:[?#][^"']*)?["']/i.test(html), 'Не подключён favicon.svg');
check(/<audio\b[^>]*\bsrc=["']audio\.mp3["']/i.test(html), 'Не подключён локальный audio.mp3');
check(/<img\b[^>]*\bsrc=["']IMG_3511\.jpeg["']/i.test(html), 'Не подключено локальное фото автора');

const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
const idSet = new Set(ids);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
check(duplicates.length === 0, `Повторяющиеся id: ${[...new Set(duplicates)].join(', ')}`);

for (const match of html.matchAll(/\bhref=["']#([^"']+)["']/gi)) {
  check(idSet.has(match[1]), `Ссылка ведёт на отсутствующий id: #${match[1]}`);
}

for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
  const value = match[1];
  if (/^(?:https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(value)) continue;
  const relative = value.split(/[?#]/)[0];
  if (!relative) continue;
  check(existsSync(resolve(root, relative)), `Не найден локальный ресурс: ${value}`);
}

let inlineScriptCount = 0;
let externalScriptCount = 0;
for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  const attributes = match[1];
  const src = attributes.match(/\bsrc=["']([^"']+)["']/i)?.[1];
  if (src) {
    if (/^(?:https?:|data:|\/\/)/i.test(src)) continue;
    const relative = src.split(/[?#]/)[0];
    if (!relative.toLowerCase().endsWith('.js')) continue;
    const source = read(relative);
    externalScriptCount += 1;
    try {
      new vm.Script(source, { filename: relative });
    } catch (error) {
      failures.push(`Ошибка синтаксиса во внешнем JavaScript-файле ${relative}: ${error.message}`);
    }
    checks += 1;
    continue;
  }
  const type = attributes.match(/\btype=["']([^"']+)["']/i)?.[1]?.toLowerCase();
  if (type && !['text/javascript', 'application/javascript'].includes(type)) continue;
  inlineScriptCount += 1;
  try {
    new vm.Script(match[2], { filename: `index.html:inline-script-${inlineScriptCount}` });
  } catch (error) {
    failures.push(`Ошибка синтаксиса во встроенном скрипте №${inlineScriptCount}: ${error.message}`);
  }
  checks += 1;
}
check(inlineScriptCount + externalScriptCount > 0, 'Не найдены JavaScript-блоки или внешние JavaScript-файлы');

for (const [asset, target] of [
  ['index.html', 'cp index.html favicon.svg audio.mp3 IMG_3511.jpeg _site/'],
  ['favicon.svg', 'cp index.html favicon.svg audio.mp3 IMG_3511.jpeg _site/'],
  ['audio.mp3', 'cp index.html favicon.svg audio.mp3 IMG_3511.jpeg _site/'],
  ['IMG_3511.jpeg', 'cp index.html favicon.svg audio.mp3 IMG_3511.jpeg _site/']
]) {
  check(workflow.includes(target), `GitHub Pages workflow не публикует ${asset}`);
}

const secretPatterns = [
  /sb_secret_[A-Za-z0-9_-]{12,}/,
  /ghp_[A-Za-z0-9]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/
];
for (const pattern of secretPatterns) {
  check(!pattern.test(html), `В index.html найден фрагмент, похожий на секрет: ${pattern}`);
}

if (failures.length) {
  console.error(`Проверка не пройдена: ${failures.length} ошибок из ${checks}`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`OK: ${checks} проверок пройдено.`);
