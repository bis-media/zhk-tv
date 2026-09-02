
import raw from '@/data/dataset.json';
import type { Dataset } from './types';

/** Полный датасет со скидочной сеткой. Только на сервере. */
export const dataset = raw as unknown as Dataset;

/** Версия для браузера: без скидочной сетки и служебных замечаний. */
export function publicDataset(): Dataset {
  const { discountGrid, problems, ...rest } = dataset;
  return rest as Dataset;
}

export const discountGrid = dataset.discountGrid ?? {};
