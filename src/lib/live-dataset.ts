import { buildDataset, validateDataset } from './dataset-builder.mjs';
import { dataset as committed } from './dataset';
import { IS_STATIC } from './mode';
import { fetchSheetSources } from './sheet.mjs';
import type { Dataset } from './types';

/**
 * Данные сайта, которые сами подтягиваются из исходной Google-таблицы.
 *
 * Логика намеренно осторожная: страница никогда не ждёт сеть. Отдаётся то,
 * что лежит в памяти (при старте — версия, собранная во время деплоя),
 * а обновление идёт фоном. Если таблица недоступна или выгрузка не прошла
 * проверку, сайт продолжает работать на прошлых данных, а причина
 * видна на /api/dataset.
 *
 * Отключить обновление на лету: SHEET_LIVE=0
 * Период обновления, секунд:     SHEET_REFRESH_SECONDS (по умолчанию 900)
 */

const LIVE = !IS_STATIC && process.env.SHEET_LIVE !== '0';
const TTL = Math.max(60, Number(process.env.SHEET_REFRESH_SECONDS ?? 900)) * 1000;

interface State {
  data: Dataset;
  fetchedAt: number;
  live: boolean;
  error: string | null;
  checkedAt: number | null;
}

const state: State = {
  data: committed,
  fetchedAt: 0,
  live: false,
  error: null,
  checkedAt: null,
};

let inflight: Promise<void> | null = null;

async function refresh(): Promise<void> {
  try {
    const sources = await fetchSheetSources();
    const next = buildDataset({
      efir: sources.efir,
      banner: sources.banner,
      stoplist: sources.stoplist,
      tt: sources.tt,
      // скрытая вкладка «Стоп-лист застройщики» через экспорт недоступна,
      // берём её из версии, собранной при деплое
      developers: committed.developerRules,
    });

    const errors = validateDataset(next);
    if (errors.length) throw new Error(errors.join('; '));

    state.data = next;
    state.fetchedAt = Date.now();
    state.live = true;
    state.error = null;
  } catch (error) {
    state.error = error instanceof Error ? error.message : String(error);
  } finally {
    state.checkedAt = Date.now();
  }
}

function scheduleRefresh(): void {
  if (!LIVE) return;
  const age = Date.now() - (state.checkedAt ?? 0);
  if (age < TTL || inflight) return;
  inflight = refresh().finally(() => { inflight = null; });
}

/** Актуальные данные. Не блокирует запрос: обновление идёт фоном. */
export function getDataset(): Dataset {
  scheduleRefresh();
  return state.data;
}

/** Ждёт завершения обновления — нужно роуту /api/dataset и диагностике. */
export async function getFreshDataset(): Promise<Dataset> {
  scheduleRefresh();
  if (inflight) await inflight;
  return state.data;
}

/**
 * Тот же датасет, но в виде объекта — чтобы серверные страницы читали поля
 * как раньше (`dataset.totals`), а данные при этом всегда брались свежие.
 * Любое обращение к полю идёт через getDataset().
 */
export const liveData: Dataset = new Proxy({} as Dataset, {
  get: (_target, prop) => getDataset()[prop as keyof Dataset],
  has: (_target, prop) => prop in getDataset(),
  ownKeys: () => Reflect.ownKeys(getDataset()),
  getOwnPropertyDescriptor: (_target, prop) =>
    Reflect.getOwnPropertyDescriptor(getDataset(), prop),
});

export function getDatasetStatus() {
  return {
    live: state.live,
    enabled: LIVE,
    refreshSeconds: TTL / 1000,
    generatedAt: state.data.generatedAt,
    lastCheckedAt: state.checkedAt ? new Date(state.checkedAt).toISOString() : null,
    lastSuccessAt: state.fetchedAt ? new Date(state.fetchedAt).toISOString() : null,
    error: state.error,
    totals: state.data.totals,
  };
}
