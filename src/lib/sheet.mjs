/**
 * Доступ к исходной Google-таблице «Основной медиаплан Умные экраны в ЖК».
 *
 * Таблица должна быть открыта по ссылке на просмотр — тогда её вкладки
 * выгружаются как CSV без ключей и авторизации.
 */

export const SHEET_ID = process.env.SHEET_ID
  || process.env.NEXT_PUBLIC_SHEET_ID
  || '1GDO5N7-EmAyvtKvbUMy5ovY12YqX4Qq_DZ7xbxv74lk';

export const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;

/** Вкладки, из которых собирается сайт. Скрытая «Стоп-лист застройщики» через экспорт недоступна. */
export const TABS = [
  { key: 'efir', file: 'efir.csv', gid: '325219839', name: 'Основной эфир' },
  { key: 'banner', file: 'banner.csv', gid: '0', name: 'Генеральный баннер' },
  { key: 'stoplist', file: 'stoplist.csv', gid: '1433213433', name: 'Стоп-лист' },
  { key: 'tt', file: 'tt.csv', gid: '1241996550', name: 'ТТ' },
  { key: 'svod', file: 'svod.csv', gid: '162083453', name: 'СВОД АП', optional: true },
  { key: 'vybor', file: 'vybor.csv', gid: '183903854', name: 'Выбор адресов', optional: true },
];

export const tabUrl = (gid) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;

/**
 * Скачивает вкладки таблицы. Бросает исключение, если вкладка недоступна
 * или вместо CSV пришла HTML-страница (значит, закрыт доступ по ссылке).
 */
export async function fetchSheetSources({ timeoutMs = 20000, signal } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  signal?.addEventListener('abort', () => controller.abort());

  try {
    const entries = await Promise.all(
      TABS.filter((tab) => !tab.optional).map(async (tab) => {
        const response = await fetch(tabUrl(tab.gid), {
          signal: controller.signal,
          redirect: 'follow',
          cache: 'no-store',
        });
        if (!response.ok) throw new Error(`вкладка «${tab.name}»: HTTP ${response.status}`);
        const text = await response.text();
        if (text.trimStart().startsWith('<')) {
          throw new Error(`вкладка «${tab.name}»: вместо CSV пришла HTML-страница — проверьте доступ по ссылке`);
        }
        return [tab.key, text];
      }),
    );
    return Object.fromEntries(entries);
  } finally {
    clearTimeout(timer);
  }
}
