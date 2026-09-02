import type { Metadata } from 'next';

import { Calculator } from '@/components/Calculator';
import { discountGrid } from '@/lib/dataset';
import { IS_STATIC } from '@/lib/mode';
import { loadQuote } from '@/lib/quotes';
import { isManager } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Медиаплан — Умные экраны в ЖК',
  description: 'Выберите города и жилые комплексы, посмотрите охват, количество контактов и стоимость размещения.',
};

export default async function CalculatorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // в статической сборке сервера нет: сохранённый расчёт калькулятор
  // достаёт из адреса страницы сам
  if (IS_STATIC) return <Calculator manager={false} />;

  const [manager, params] = await Promise.all([isManager(), searchParams]);
  const quoteId = typeof params.q === 'string' ? params.q : undefined;
  const quote = quoteId ? await loadQuote(quoteId) : null;

  return (
    <Calculator
      manager={manager}
      discountGrid={manager ? discountGrid : undefined}
      initial={quote}
    />
  );
}
