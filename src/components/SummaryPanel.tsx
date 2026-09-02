'use client';

import type { CalcResult } from '@/lib/calc';
import { money, moneyShort, months as fMonths, n, percent } from '@/lib/format';
import type { Dataset, FormatId } from '@/lib/types';

interface Props {
  dataset: Dataset;
  result: CalcResult;
  format: FormatId;
  months: number;
  manager: boolean;
  personal: Record<string, number>;
  onPersonalChange: (next: Record<string, number>) => void;
  onRemove: (complexId: string) => void;
  onSave: () => void;
}

export function SummaryPanel({
  dataset, result, format, months, manager, personal, onPersonalChange, onRemove, onSave,
}: Props) {
  const { totals, lines } = result;
  const empty = lines.length === 0;
  const globalPersonal = personal['*'] ?? 0;

  const setGlobal = (value: number) => {
    const next = { ...personal };
    if (value > 0) next['*'] = value; else delete next['*'];
    onPersonalChange(next);
  };

  return (
    <div className="card card--pad stack gap-16">
      <div className="row gap-8">
        <span className="summary__title">Ваш медиаплан</span>
        <span className="spacer" />
        <span className="chip chip--accent">{dataset.formats[format].short}</span>
      </div>

      {empty ? (
        <div className="note note--muted">
          Выберите жилые комплексы — здесь появятся охват, количество контактов и стоимость размещения.
        </div>
      ) : (
        <>
          <div className="summary__grid">
            <div className="summary__cell"><b className="tabular">{n(lines.length)}</b><span>жилых комплексов</span></div>
            <div className="summary__cell"><b className="tabular">{n(totals.houses)}</b><span>домов</span></div>
            <div className="summary__cell"><b className="tabular">{n(totals.screens)}</b><span>экранов</span></div>
            <div className="summary__cell"><b className="tabular">{n(totals.flats)}</b><span>квартир</span></div>
            <div className="summary__cell"><b className="tabular">{n(totals.residents)}</b><span>жителей в охвате</span></div>
            <div className="summary__cell"><b className="tabular">{n(totals.ots)}</b><span>контактов (OTS)</span></div>
          </div>

          <div>
            <div className="summary__line">
              <span>Срок размещения</span><b>{fMonths(months)}</b>
            </div>
            {format === 'video' && (
              <div className="summary__line">
                <span>Показов в сутки</span><b className="tabular">{n(totals.showsPerDay)}</b>
              </div>
            )}
            <div className="summary__line">
              <span>Стоимость 1000 контактов</span>
              <b className="tabular">{money(manager ? result.cptFinal : result.cpt)}</b>
            </div>
            <div className="summary__line">
              <span>Без НДС</span><b className="tabular">{money(totals.noVat)}</b>
            </div>
          </div>

          <div className="divider" />

          {manager ? (
            <div className="stack gap-10">
              <div className="summary__line">
                <span>Прайс с НДС</span>
                <b className="tabular" style={{ textDecoration: result.finalVat < totals.vat ? 'line-through' : 'none', opacity: .7 }}>
                  {money(totals.vat)}
                </b>
              </div>
              <div className="summary__line">
                <span>После категорийной скидки</span>
                <b className="tabular">{money(result.discountedVat)}</b>
              </div>
              <label className="summary__line" style={{ alignItems: 'center' }}>
                <span>Персональная скидка на всё</span>
                <span className="row gap-6">
                  <input
                    className="discount-input tabular"
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={globalPersonal || ''}
                    placeholder="0"
                    onChange={(e) => setGlobal(Number(e.target.value) || 0)}
                  />
                  <span className="muted">%</span>
                </span>
              </label>

              <div className="summary__total">
                <span className="small muted">Итого с НДС</span>
                <b>{money(result.finalVat)}</b>
              </div>
              {result.saving > 0 && (
                <div className="note note--info">
                  Экономия клиента — {money(result.saving)} ({percent(result.saving / totals.vat, 1)} от прайса)
                </div>
              )}
            </div>
          ) : (
            <div className="stack gap-8">
              <div className="summary__total">
                <span className="small muted">Стоимость с НДС</span>
                <b>{money(totals.vat)}</b>
              </div>
              <div className="tiny muted">
                Цена по прайсу за {fMonths(months)}. Скидки за объём и срок менеджер рассчитывает
                индивидуально — сохраните расчёт и отправьте ссылку.
              </div>
            </div>
          )}

          <div className="stack gap-8">
            <button type="button" className="btn btn--lg" onClick={onSave}>
              Сохранить и получить ссылку
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => window.print()}>
              Распечатать
            </button>
          </div>

          <div className="divider" />

          <div className="stack gap-6" style={{ maxHeight: 320, overflowY: 'auto' }}>
            <span className="tiny muted strong">ВЫБРАННЫЕ ЖК</span>
            {lines.map((l) => (
              <div key={l.complex.id} className="row gap-8" style={{ fontSize: 13 }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="strong">{l.complex.name}</span>
                  <span className="muted"> · {l.complex.city}</span>
                  {l.partial && <span className="muted"> · {l.houses} из {l.complex.housesList.length} домов</span>}
                  {manager && l.categoryDiscount > 0 && (
                    <span className="chip chip--ok" style={{ marginLeft: 6 }}>−{percent(l.categoryDiscount, 1)}</span>
                  )}
                </span>
                {manager && (
                  <input
                    className="discount-input tabular"
                    style={{ width: 54 }}
                    type="number"
                    min={0}
                    max={100}
                    title="Персональная скидка на этот ЖК, %"
                    value={personal[l.complex.id] ?? ''}
                    placeholder={String(globalPersonal || 0)}
                    onChange={(e) => {
                      const next = { ...personal };
                      const v = Number(e.target.value);
                      if (v > 0) next[l.complex.id] = v; else delete next[l.complex.id];
                      onPersonalChange(next);
                    }}
                  />
                )}
                <span className="tabular muted" style={{ minWidth: 74, textAlign: 'right' }}>
                  {moneyShort(manager ? l.finalVat : l.vat)}
                </span>
                <button
                  type="button"
                  className="cx__expand"
                  onClick={() => onRemove(l.complex.id)}
                  aria-label={`Убрать ${l.complex.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
