#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const indexPath = resolve(root, 'index.html');
const stylePath = resolve(root, 'style.css');
const scriptPath = resolve(root, 'script.js');

function replaceBlock(html, openTag, closeTag, content) {
  const start = html.indexOf(openTag);
  if (start === -1) throw new Error(`Не найден блок ${openTag.trim()}`);
  const contentStart = start + openTag.length;
  const end = html.indexOf(closeTag, contentStart);
  if (end === -1) throw new Error(`Не найден закрывающий тег ${closeTag.trim()}`);
  return html.slice(0, contentStart) + content.trimEnd() + '\n' + html.slice(end);
}

let html = readFileSync(indexPath, 'utf8');
const style = readFileSync(stylePath, 'utf8');
const script = readFileSync(scriptPath, 'utf8');

html = replaceBlock(html, '<style>\n', '\n</style>', style);
html = replaceBlock(html, '<script>\n', '\n</script>', script);
writeFileSync(indexPath, html);
console.log('index.html: встроенные стили и скрипт синхронизированы с style.css и script.js');
