'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { QuoteView } from './QuoteView';
import { DATASET_URL } from '@/lib/mode';
import { decodeQuote } from '@/lib/quotelink';
import type { Dataset, QuoteInput } from '@/lib/types';

/** Расчёт, распакованный из адреса страницы: /quote?d=… */
export function QuoteFromLink() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [quote, setQuote] = useState<QuoteInput | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'broken'>('loading');

  useEffect(() => {
    let alive = true;
    const code = new URLSearchParams(window.location.search).get('d');

    Promise.all([
      fetch(DATASET_URL).then((r) => r.json() as Promise<Dataset>),
      code ? decodeQuote(code) : Promise.resolve(null),
    ])
      .then(([data, decoded]) => {
        if (!alive) return;
        setDataset(data);
        setQuote(decoded);
        setState(decoded ? 'ready' : 'broken');
      })
      .catch(() => { if (alive) setState('broken'); });

    return () => { alive = false; };
  }, []);

  if (state === 'loading') {
    return (
      <div className="wrap" style={{ paddingTop: 32 }}>
        <div className="skeleton" style={{ height: 120, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    );
  }

  if (state === 'broken' || !dataset || !quote) {
    return (
      <div className="wrap" style={{ paddingTop: 40 }}>
        <div className="card empty">
          Ссылка на расчёт повреждена или устарела.{' '}
          <Link href="/calculator" style={{ color: 'var(--brand)' }}>Собрать медиаплан заново</Link>
        </div>
      </div>
    );
  }

  const code = new URLSearchParams(window.location.search).get('d') ?? '';

  return (
    <QuoteView
      dataset={dataset}
      quote={quote}
      showDiscounts={false}
      editHref={`/calculator?d=${encodeURIComponent(code)}`}
    />
  );
}
