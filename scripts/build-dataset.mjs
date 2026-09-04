/**
 * Собирает src/data/dataset.json и public/dataset.json из выгрузок таблицы.
 *
 *   npm run build:data              — из локальных файлов data/source/*.csv
 *   npm run build:data -- --remote  — предварительно скачав свежие вкладки
 *
 * Вся логика конвертации живёт в src/lib/dataset-builder.mjs — тот же модуль
 * использует серверный роут /api/dataset, который обновляет данные на лету.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildDataset, validateDataset } from '../src/lib/dataset-builder.mjs';
import { TABS, fetchSheetSources } from '../src/lib/sheet.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'data', 'source');
const OUT = join(ROOT, 'src', 'data', 'dataset.json');
const PUBLIC_OUT = join(ROOT, 'public', 'dataset.json');

const remote = process.argv.includes('--remote');

const read = (file) => readFileSync(join(SRC, file), 'utf8');

let sources;

if (remote) {
  console.log('Скачиваю свежие вкладки из таблицы…');
  const fetched = await fetchSheetSources();
  // сохраняем выгрузку рядом с проектом, чтобы сборка была воспроизводимой
  for (const tab of TABS) {
    if (fetched[tab.key]) writeFileSync(join(SRC, tab.file), fetched[tab.key], 'utf8');
  }
  sources = { ...fetched, developers: JSON.parse(read('developers.json')) };
} else {
  sources = {
    efir: read('efir.csv'),
    banner: read('banner.csv'),
    stoplist: read('stoplist.csv'),
    tt: read('tt.csv'),
    developers: JSON.parse(read('developers.json')),
  };
}

const dataset = buildDataset(sources);

const errors = validateDataset(dataset);
if (errors.length) {
  console.error('Выгрузка не прошла проверку:');
  for (const e of errors) console.error('  •', e);
  process.exit(1);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(dataset), 'utf8');

// публичная копия для браузера: без скидочной сетки (она видна только менеджеру)
// и без служебных замечаний к исходнику
const { discountGrid, problems: _problems, ...publicDataset } = dataset;
mkdirSync(dirname(PUBLIC_OUT), { recursive: true });
writeFileSync(PUBLIC_OUT, JSON.stringify(publicDataset), 'utf8');

console.log('dataset.json собран');
console.table(dataset.totals);

if (dataset.problems.length) {
  console.log(`\nЗамечания к исходным данным (${dataset.problems.length}):`);
  for (const p of dataset.problems) console.log('  •', p);
}
