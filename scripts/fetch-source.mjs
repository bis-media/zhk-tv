/**
 * Скачивает вкладки исходной Google-таблицы в data/source/*.csv.
 *
 * Запуск: npm run fetch:data
 *
 * Таблица должна быть доступна по ссылке («Просмотр для всех, у кого есть ссылка»).
 * Скрытая вкладка «Стоп-лист застройщики» через экспорт недоступна —
 * она поддерживается вручную в data/source/developers.json.
 */

import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SHEET_ID = process.env.SHEET_ID || '1GDO5N7-EmAyvtKvbUMy5ovY12YqX4Qq_DZ7xbxv74lk';
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'source');

const TABS = [
  { file: 'efir.csv', gid: '325219839', name: 'Основной эфир' },
  { file: 'banner.csv', gid: '0', name: 'Генеральный баннер' },
  { file: 'svod.csv', gid: '162083453', name: 'СВОД АП' },
  { file: 'stoplist.csv', gid: '1433213433', name: 'Стоп-лист' },
  { file: 'vybor.csv', gid: '183903854', name: 'Выбор адресов' },
  { file: 'tt.csv', gid: '1241996550', name: 'ТТ' },
];

let failed = 0;

for (const tab of TABS) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${tab.gid}`;
  try {
    const response = await fetch(url, { redirect: 'follow' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    if (text.trimStart().startsWith('<')) throw new Error('вместо CSV пришла HTML-страница — проверьте доступ по ссылке');
    await writeFile(join(SRC, tab.file), text, 'utf8');
    console.log(`✓ ${tab.name} → data/source/${tab.file} (${(text.length / 1024).toFixed(0)} КБ)`);
  } catch (error) {
    failed++;
    console.error(`✗ ${tab.name}: ${error instanceof Error ? error.message : error}`);
  }
}

if (failed) {
  console.error(`\nНе удалось скачать вкладок: ${failed}. Данные не обновлены полностью.`);
  process.exit(1);
}

console.log('\nГотово. Дальше: npm run build:data');
