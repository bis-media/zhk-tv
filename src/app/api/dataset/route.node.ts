import { NextResponse } from 'next/server';

import { getDatasetStatus, getFreshDataset } from '@/lib/live-dataset';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Данные для калькулятора и карты. Подтягиваются из исходной Google-таблицы
 * и обновляются сами; скидочная сетка и служебные замечания в браузер не уходят.
 *
 * /api/dataset?status=1 — короткая диагностика: когда обновлялись, что пошло не так.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);

  if (url.searchParams.get('status')) {
    await getFreshDataset();
    return NextResponse.json(getDatasetStatus(), {
      headers: { 'cache-control': 'no-store' },
    });
  }

  const dataset = await getFreshDataset();
  const { discountGrid, problems, ...publicDataset } = dataset;

  return NextResponse.json(publicDataset, {
    headers: {
      // короткий кэш на клиенте, дальше сервер сам решает, пора ли обновляться
      'cache-control': 'public, max-age=60, stale-while-revalidate=600',
    },
  });
}
