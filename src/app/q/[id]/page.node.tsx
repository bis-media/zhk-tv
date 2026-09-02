import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { QuoteView } from '@/components/QuoteView';
import { dataset, discountGrid } from '@/lib/dataset';
import { loadQuote } from '@/lib/quotes';
import { isManager } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Расчёт размещения — Умные экраны в ЖК',
  robots: { index: false, follow: false },
};

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, manager] = await Promise.all([params, isManager()]);
  const quote = await loadQuote(id);
  if (!quote) notFound();

  const showDiscounts = manager || Boolean(quote.revealDiscounts);

  return (
    <QuoteView
      dataset={dataset}
      quote={quote}
      showDiscounts={showDiscounts}
      discountGrid={showDiscounts ? discountGrid : undefined}
      editHref={`/calculator?q=${quote.id}`}
      number={quote.id}
      createdAt={quote.createdAt}
    />
  );
}
