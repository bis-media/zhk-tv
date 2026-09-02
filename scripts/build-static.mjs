/**
 * Статическая сборка для GitHub Pages.
 *
 *   npm run build:static                    — в корень домена
 *   BASE_PATH=/zhk-tv npm run build:static  — в подпапку (проектный сайт GitHub Pages)
 *
 * Отличия от обычной сборки описаны в next.config.mjs: серверных страниц
 * и API в результат не попадают, расчёт кодируется в саму ссылку.
 */

import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const basePath = process.env.BASE_PATH || '';

function run(command, args) {
  // без shell: путь к node на Windows может содержать пробелы
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, STATIC_EXPORT: '1', BASE_PATH: basePath },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(process.execPath, [join(ROOT, 'scripts', 'build-dataset.mjs')]);
run(process.execPath, [join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next'), 'build']);

// без этого файла GitHub Pages прячет папки, начинающиеся с подчёркивания
writeFileSync(join(ROOT, 'out', '.nojekyll'), '');

console.log(`\nГотово: out/${basePath ? ` (basePath ${basePath})` : ''}`);
