'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { calculate, developerAllowed } from '@/lib/calc';
import { complexes as fComplexes, money, n, screens as fScreens } from '@/lib/format';
import { DATASET_URL } from '@/lib/mode';
import type { Dataset, FormatId, Selection } from '@/lib/types';

const ComplexMap = dynamic(() => import('./ComplexMap').then((m) => m.ComplexMap), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: 560 }} />,
});

const STORAGE_KEY = 'zhk-calc-state-v1';
const DEVELOPER_INDUSTRY = 'Застройщик, агентство недвижимости';

/** Карта работает с тем же черновиком, что и калькулятор. */
interface Draft {
  format: FormatId;
  months: number;
  industry: string;
  activeCities: string[];
  selection: Selection;
}

const emptyDraft = (): Draft => ({ format: 'video', months: 1, industry: '', activeCities: [], selection: {} });

export function MapExplorer() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [restored, setRestored] = useState(false);
  const [city, setCity] = useState('');

  useEffect(() => {
    let alive = true;
    fetch(DATASET_URL).then((r) => r.json()).then((d: Dataset) => { if (alive) setDataset(d); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setDraft({ ...emptyDraft(), ...(JSON.parse(saved) as Draft) });
    } catch { /* черновик недоступен */ }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); } catch { /* приватный режим */ }
  }, [restored, draft]);

  const blocked = useMemo(() => {
    if (!dataset || draft.industry !== DEVELOPER_INDUSTRY) return new Set<string>();
    return new Set(dataset.complexes.filter((c) => !developerAllowed(dataset, c)).map((c) => c.id));
  }, [dataset, draft.industry]);

  const visible = useMemo(() => {
    if (!dataset) return [];
    return city ? dataset.complexes.filter((c) => c.city === city) : dataset.complexes;
  }, [dataset, city]);

  const result = useMemo(() => {
    if (!dataset) return null;
    return calculate(dataset, { format: draft.format, months: draft.months, selection: draft.selection });
  }, [dataset, draft.format, draft.months, draft.selection]);

  const toggle = useCallback((id: string) => {
    setDraft((prev) => {
      const selection = { ...prev.selection };
      if (selection[id]) delete selection[id];
      else selection[id] = 'all';
      return { ...prev, selection };
    });
  }, []);

  if (!dataset || !result) {
    return <div className="skeleton" style={{ height: 560, margin: '24px 0' }} />;
  }

  return (
    <>
      <div className="toolbar" style={{ marginTop: 20 }}>
        <select className="select" value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">Все города ({dataset.cities.length})</option>
          {dataset.cities.map((c) => (
            <option key={c.name} value={c.name}>{c.name} — {c.complexes} ЖК</option>
          ))}
        </select>
        <select
          className="select"
          value={draft.format}
          onChange={(e) => setDraft((p) => ({ ...p, format: e.target.value as FormatId }))}
        >
          <option value="video">Видеоролик 10 сек</option>
          <option value="banner">Генеральный баннер</option>
        </select>
        <span className="small muted">
          На карте {fComplexes(visible.length)} · {fScreens(visible.reduce((a, c) => a + c.screens, 0))}
        </span>
      </div>

      <ComplexMap
        complexes={visible}
        selection={draft.selection}
        blocked={blocked}
        format={draft.format}
        months={draft.months}
        onToggle={toggle}
        fitKey={city}
      />

      <div className="card card--pad row wrapline gap-16" style={{ marginTop: 20, alignItems: 'center' }}>
        {result.lines.length ? (
          <>
            <div>
              <div className="strong" style={{ fontSize: 18 }}>
                В медиаплане {fComplexes(result.lines.length)}, {n(result.totals.screens)} экранов
              </div>
              <div className="small muted" style={{ marginTop: 4 }}>
                Охват {n(result.totals.residents)} жителей · {money(result.totals.vat)} за месяц с НДС
              </div>
            </div>
            <span className="spacer" />
            <button
              type="button"
              className="btn btn--plain"
              onClick={() => setDraft((p) => ({ ...p, selection: {} }))}
            >
              Очистить
            </button>
            <Link href="/calculator" className="btn btn--lg">Перейти к расчёту</Link>
          </>
        ) : (
          <>
            <div className="muted">
              Нажмите на точку и добавьте ЖК в медиаплан — выбор сохранится и откроется в калькуляторе.
            </div>
            <span className="spacer" />
            <Link href="/calculator" className="btn btn--plain">Открыть калькулятор</Link>
          </>
        )}
      </div>
    </>
  );
}
