import type { Metadata } from 'next';

import { QuoteFromLink } from '@/components/QuoteFromLink';

export const metadata: Metadata = {
  title: 'Расчёт размещения — Умные экраны в ЖК',
  robots: { index: false, follow: false },
};

export default function QuoteLinkPage() {
  return <QuoteFromLink />;
}
