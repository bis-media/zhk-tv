'use client';

import { memo } from 'react';

import { money, n } from '@/lib/format';
import type { Complex, FormatId, Selection } from '@/lib/types';

interface Props {
  complex: Complex;
  format: FormatId;
  months: number;
  selection: Selection;
  blocked: boolean;
  expanded: boolean;
  onToggle: () => void;
  onToggleHouse: (address: string) => void;
  onExpand: () => void;
}

function ComplexRowInner({
  complex, format, months, selection, blocked, expanded, onToggle, onToggleHouse, onExpand,
}: Props) {
  const picked = selection[complex.id];
  const pickedAddresses = picked === 'all'
    ? new Set(complex.housesList.map((h) => h.address))
    : new Set(Array.isArray(picked) ? picked : []);

  const state = !picked ? 'false' : pickedAddresses.size === complex.housesList.length ? 'true' : 'part';

  const chosen = complex.housesList.filter((h) => pickedAddresses.has(h.address));
  const shown = chosen.length ? chosen : complex.housesList;

  const screens = shown.reduce((a, h) => a + h.screens, 0);
  const residents = shown.reduce((a, h) => a + h.residents, 0);
  const metrics = shown.reduce(
    (a, h) => {
      const m = format === 'video' ? h.video : h.banner;
      a.ots += m.ots * months;
      a.vat += m.vat * months;
      return a;
    },
    { ots: 0, vat: 0 },
  );

  return (
    <div className="cx" data-on={Boolean(picked)} data-blocked={blocked}>
      <div
        className="cx__row"
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      >
        <span className="check" data-on={state}>{state === 'part' ? '–' : '✓'}</span>

        {complex.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="cx__photo" src={complex.photo} alt={complex.name} loading="lazy" />
        ) : (
          <span className="cx__photo cx__photo--empty" aria-hidden="true">
            {complex.housing ? complex.housing.slice(0, 1) : '—'}
          </span>
        )}

        <span className="cx__main">
          <span className="cx__name">
            {complex.name}
            <span className="chip">{complex.city}</span>
            <span className="chip">кат. {complex.category}</span>
            {complex.housing && <span className="chip">{complex.housing}</span>}
            {state === 'part' && <span className="chip chip--accent">{chosen.length} из {complex.housesList.length} домов</span>}
            {blocked && <span className="chip chip--danger">застройщикам недоступно</span>}
          </span>
          <span className="cx__meta">
            <span>{complex.district || '—'}</span>
            <span>пакет «{complex.pack}»</span>
            <span>{complex.housesList.length} домов · {complex.screens} экранов</span>
          </span>
        </span>

        <span className="cx__nums">
          <span className="cx__num"><b>{n(screens)}</b><span>экранов</span></span>
          <span className="cx__num"><b>{n(residents)}</b><span>жителей</span></span>
          <span className="cx__num"><b>{n(metrics.ots)}</b><span>OTS</span></span>
        </span>

        <span className="cx__price">{money(metrics.vat)}</span>

        <button
          type="button"
          className="cx__expand"
          onClick={(e) => { e.stopPropagation(); onExpand(); }}
          aria-label="Показать дома"
        >
          {expanded ? '▲ дома' : '▼ дома'}
        </button>
      </div>

      {expanded && (
        <div className="cx__houses">
          {complex.housesList.map((h) => {
            const on = pickedAddresses.has(h.address);
            const m = format === 'video' ? h.video : h.banner;
            return (
              <div
                key={h.address}
                className="house"
                role="button"
                tabIndex={0}
                onClick={() => onToggleHouse(h.address)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleHouse(h.address); } }}
                style={{ cursor: blocked ? 'not-allowed' : 'pointer' }}
              >
                <span className="check" data-on={on ? 'true' : 'false'}>✓</span>
                <span className="house__addr">
                  {h.address}
                  <span className="house__meta">
                    {' '}· {h.screens} экр. ({h.hall} холл / {h.lift} лифт)
                    {h.year ? ` · ${h.year} г.` : ''}
                    {h.floors ? ` · ${h.floors} эт.` : ''}
                  </span>
                </span>
                {h.photoLink && (
                  <a
                    className="house__meta"
                    href={h.photoLink}
                    target="_blank"
                    rel="noreferrer noopener"
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: 'var(--brand)' }}
                  >
                    фото
                  </a>
                )}
                <span className="house__meta tabular">{n(h.residents)} жит.</span>
                <span className="house__meta tabular">{n(m.ots * months)} OTS</span>
                <span className="tabular" style={{ minWidth: 84, textAlign: 'right' }}>{money(m.vat * months)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const ComplexRow = memo(ComplexRowInner);
