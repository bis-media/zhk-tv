/**
 * Статическая сборка (GitHub Pages) отличается от серверной:
 * нет API сохранения расчётов, нет режима менеджера и скидочной сетки.
 * Расчёт в этом режиме кодируется прямо в ссылку.
 */
export const IS_STATIC = process.env.NEXT_PUBLIC_STATIC === '1';

/** Префикс пути на GitHub Pages, например «/zhk-tv». Для обычной сборки пустой. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** Путь к файлу в public с учётом basePath. */
export const asset = (path: string) => `${BASE_PATH}${path}`;

/**
 * Откуда браузер берёт данные. В серверной сборке — роут, который сам
 * подтягивает свежую версию из Google-таблицы. В статике сервера нет,
 * поэтому используется файл, собранный при деплое.
 */
export const DATASET_URL = IS_STATIC ? `${BASE_PATH}/dataset.json` : `${BASE_PATH}/api/dataset`;
