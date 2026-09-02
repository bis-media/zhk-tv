'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ComplexRow } from './ComplexRow';
import { SaveQuoteDialog } from './SaveQuoteDialog';
import { SummaryPanel } from './SummaryPanel';
import { calculate, developerAllowed } from '@/lib/calc';
import { complexes as fComplexes, houses as fHouses, money, n, screens as fScreens } from '@/lib/format';
import { asset } from '@/lib/mode';
import { decodeQuote } from '@/lib/quotelink';
import type { Complex, Dataset, FormatId, QuoteInput, Selection } from '@/lib/types';

const ComplexMap = dynamic(() => import('./ComplexMap').then((m) => m.ComplexMap), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: 560 }} />,
});

const STORAGE_KEY = 'zhk-calc-state-v1';
const MONTH_OPTIONS = [1, 2, 3, 6, 9, 12];

const INDUSTRIES = [
  'Ритейл и товары',
  'Услуги для дома',
  'Медицина и клиники',
  'Красота, фитнес, спорт',
  'Общепит и доставка еды',
  'Авто: продажа и сервис',
  'Банки, страхование, финансы',
  'Образование и детские центры',
  'Мероприятия и культура',
  'Госорганы и социальные проекты',
  'Застройщик, агентство недвижимости',
  'Другое',
];

const DEVELOPER_INDUSTRY = 'Застройщик, агентство недвижимости';

interface Props {
  manager: boolean;
  discountGrid?: Record<string, number>;
  initial?: QuoteInput | null;
}

interface Persisted {
  format: FormatId;
  months: number;
  industry: string;
  activeCities: string[];
  selection: Selection;
}

export function Calculator({ manager, discountGrid, initial }: Props) {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [format, setFormat] = useState<FormatId>(initial?.format ?? 'video');
  const [monthsCount, setMonths] = useState<number>(initial?.months ?? 1);
  const [industry, setIndustry] = useState<string>(initial?.advertiser.industry ?? '');
  const [selection, setSelection] = useState<Selection>(initial?.selection ?? {});
  const [activeCities, setActiveCities] = useState<string[]>([]);
  const [personal, setPersonal] = useState<Record<string, number>>(initial?.personalDiscounts ?? {});

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [housingFilter, setHousingFilter] = useState('');
  const [onlySelected, setOnlySelected] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [saveOpen, setSaveOpen] = useState(false);
  const [view, setView] = useState<'list' | 'map'>('list');

  /* ------------------------------------------------------------ данные --- */

  useEffect(() => {
    let alive = true;
    fetch(asset('/dataset.json'))
      .then((r) => r.json())
      .then((d: Dataset) => { if (alive) setDataset(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  /* ------------------------------------------------- сохранение в браузере */

  const [restored, setRestored] = useState(false);
  const [fromLink, setFromLink] = useState<QuoteInput | null>(null);

  useEffect(() => {
    let alive = true;

    function applyQuote(q: QuoteInput) {
      setFormat(q.format);
      setMonths(q.months);
      setSelection(q.selection);
      if (q.advertiser?.industry) setIndustry(q.advertiser.industry);
      setFromLink(q);
    }

    function restoreDraft() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        const p = JSON.parse(saved) as Persisted;
        if (p.format) setFormat(p.format);
        if (p.months) setMonths(p.months);
        if (p.industry) setIndustry(p.industry);
        if (Array.isArray(p.activeCities)) setActiveCities(p.activeCities);
        if (p.selection) setSelection(p.selection);
      } catch { /* черновик недоступен — не страшно */ }
    }

    // расчёт, открытый по ссылке, важнее локального черновика
    if (initial) {
      setRestored(true);
      return;
    }

    const code = new URLSearchParams(window.location.search).get('d');
    if (code) {
      decodeQuote(code).then((q) => {
        if (!alive) return;
        if (q) applyQuote(q); else restoreDraft();
        setRestored(true);
      });
      return () => { alive = false; };
    }

    restoreDraft();
    setRestored(true);
    return () => { alive = false; };
  }, [initial]);

  useEffect(() => {
    // пишем черновик только после попытки восстановления, иначе пустое
    // стартовое состояние затрёт сохранённый выбор
    if (!restored) return;
    const p: Persisted = { format, months: monthsCount, industry, activeCities, selection };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* приватный режим */ }
  }, [restored, format, monthsCount, industry, activeCities, selection]);

  /* при открытии сохранённого расчёта показываем города из него */
  useEffect(() => {
    const opened = initial ?? fromLink;
    if (!dataset || !opened) return;
    const cities = new Set<string>();
    for (const c of dataset.complexes) if (opened.selection[c.id]) cities.add(c.city);
    setActiveCities([...cities]);
  }, [dataset, initial, fromLink]);

  /* ------------------------------------------------------------ расчёт --- */

  const blocked = useMemo(() => {
    if (!dataset || industry !== DEVELOPER_INDUSTRY) return new Set<string>();
    return new Set(dataset.complexes.filter((c) => !developerAllowed(dataset, c)).map((c) => c.id));
  }, [dataset, industry]);

  /* если тематика сменилась на застройщика — снимаем недоступные ЖК */
  useEffect(() => {
    if (!blocked.size) return;
    setSelection((prev) => {
      const next: Selection = {};
      let changed = false;
      for (const [id, value] of Object.entries(prev)) {
        if (blocked.has(id)) { changed = true; continue; }
        next[id] = value;
      }
      return changed ? next : prev;
    });
  }, [blocked]);

  const result = useMemo(() => {
    if (!dataset) return null;
    return calculate(dataset, {
      format,
      months: monthsCount,
      selection,
      discountGrid: manager ? discountGrid : undefined,
      personalDiscounts: manager ? personal : undefined,
    });
  }, [dataset, format, monthsCount, selection, manager, discountGrid, personal]);

  const visible = useMemo(() => {
    if (!dataset) return [];
    const q = search.trim().toLowerCase();
    return dataset.complexes.filter((c) => {
      if (activeCities.length && !activeCities.includes(c.city)) return false;
      if (categoryFilter && c.category !== categoryFilter) return false;
      if (housingFilter && c.housing !== housingFilter) return false;
      if (onlySelected && !selection[c.id]) return false;
      if (q) {
        const hay = `${c.name} ${c.city} ${c.district} ${c.pack}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [dataset, activeCities, categoryFilter, housingFilter, onlySelected, search, selection]);

  const housingOptions = useMemo(
    () => [...new Set((dataset?.complexes ?? []).map((c) => c.housing).filter(Boolean))].sort(),
    [dataset],
  );

  /* ----------------------------------------------------------- действия -- */

  const toggleComplex = useCallback((c: Complex) => {
    if (blocked.has(c.id)) return;
    setSelection((prev) => {
      const next = { ...prev };
      if (next[c.id]) delete next[c.id];
      else next[c.id] = 'all';
      return next;
    });
  }, [blocked]);

  const toggleHouse = useCallback((c: Complex, address: string) => {
    if (blocked.has(c.id)) return;
    setSelection((prev) => {
      const current = prev[c.id];
      const all = c.housesList.map((h) => h.address);
      const picked = current === 'all' ? all : Array.isArray(current) ? current : [];
      const next = picked.includes(address)
        ? picked.filter((a) => a !== address)
        : [...picked, address];
      const copy = { ...prev };
      if (!next.length) delete copy[c.id];
      else if (next.length === all.length) copy[c.id] = 'all';
      else copy[c.id] = next;
      return copy;
    });
  }, [blocked]);

  const selectVisible = useCallback(() => {
    setSelection((prev) => {
      const next = { ...prev };
      for (const c of visible) if (!blocked.has(c.id)) next[c.id] = 'all';
      return next;
    });
  }, [visible, blocked]);

  const clearAll = useCallback(() => setSelection({}), []);

  const toggleCity = useCallback((city: string) => {
    setActiveCities((prev) => (prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]));
  }, []);

  const toggleExpanded = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  /* -------------------------------------------------------------- вид ---- */

  if (!dataset || !result) {
    return (
      <div className="wrap" style={{ padding: '32px 0' }}>
        <div className="skeleton" style={{ height: 120, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    );
  }

  const fmt = dataset.formats[format];
  const selectedCount = Object.keys(selection).length;

  return (
    <div className="wrap calc">
      <div>
        {/* ------------------------------------------------ шаг 1: формат -- */}
        <section className="stepblock">
          <div className="stepblock__head">
            <span className="stepblock__badge">1</span>
            <span className="stepblock__title">Формат и срок размещения</span>
          </div>

          <div className="optiongrid">
            {(['video', 'banner'] as FormatId[]).map((id) => {
              const f = dataset.formats[id];
              return (
                <button
                  key={id}
                  type="button"
                  className="option"
                  data-on={format === id}
                  onClick={() => setFormat(id)}
                >
                  <div className="option__title">
                    {f.title}
                    {format === id && <span className="chip chip--accent">выбрано</span>}
                  </div>
                  <div className="option__desc">{f.description}</div>
                  <div className="option__price">
                    {money(f.pricePerScreenVat)} <span className="small muted">за экран в месяц, с НДС</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="card card--pad" style={{ marginTop: 12 }}>
            <div className="row wrapline gap-16">
              <div className="stack gap-8">
                <span className="small strong">Срок размещения</span>
                <div className="months">
                  {MONTH_OPTIONS.map((m) => (
                    <button key={m} type="button" data-on={monthsCount === m} onClick={() => setMonths(m)}>
                      {m}
                    </button>
                  ))}
                  <span className="small muted">мес.</span>
                </div>
              </div>

              <div className="field" style={{ minWidth: 260, flex: 1 }}>
                <span>Тематика рекламы</span>
                <select className="select" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                  <option value="">Не указана</option>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>

            {industry === DEVELOPER_INDUSTRY && (
              <div className="note note--warn" style={{ marginTop: 12 }}>
                Реклама застройщиков и агентств недвижимости доступна не везде: собственники части
                ЖК не допускают конкурентов на свои дома. Недоступные ЖК в списке отмечены и
                выбрать их нельзя — сейчас закрыто {blocked.size} из {dataset.complexes.length} ЖК.
              </div>
            )}
            <div className="note note--muted" style={{ marginTop: 12 }}>
              Перед бронированием проверьте тематику по <a href="/rules">стоп-листу ФЗ-38</a>:
              алкоголь, табак и вейпы, БАДы и лекарства, букмекеры и лотереи, займы и криптовалюты,
              ритуальные и интим-услуги в жилых домах не размещаются.
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- шаг 2: гео --- */}
        <section className="stepblock">
          <div className="stepblock__head">
            <span className="stepblock__badge">2</span>
            <span className="stepblock__title">География</span>
            {activeCities.length > 0 && (
              <button type="button" className="btn btn--sm btn--ghost" onClick={() => setActiveCities([])}>
                Показать все города
              </button>
            )}
          </div>

          <div className="citygrid">
            {dataset.cities.map((city) => {
              const on = activeCities.includes(city.name);
              const picked = dataset.complexes.filter((c) => c.city === city.name && selection[c.id]).length;
              return (
                <button
                  key={city.name}
                  type="button"
                  className="citycard"
                  data-on={on}
                  onClick={() => toggleCity(city.name)}
                >
                  <span className="citycard__name">
                    {city.name}
                    {picked > 0 && <span className="chip chip--accent" style={{ marginLeft: 6 }}>{picked}</span>}
                  </span>
                  <span className="citycard__meta">
                    {fComplexes(city.complexes)} · {fScreens(city.screens)}
                  </span>
                  <span className="citycard__meta">{n(city.residents)} жителей</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* -------------------------------------------------- шаг 3: ЖК ---- */}
        <section className="stepblock">
          <div className="stepblock__head">
            <span className="stepblock__badge">3</span>
            <span className="stepblock__title">Жилые комплексы</span>
            <span className="small muted">
              найдено {fComplexes(visible.length)}, выбрано {selectedCount}
            </span>
          </div>

          <div className="toolbar">
            <div className="viewswitch">
              <button type="button" data-on={view === 'list'} onClick={() => setView('list')}>Списком</button>
              <button type="button" data-on={view === 'map'} onClick={() => setView('map')}>На карте</button>
            </div>
            <input
              className="input search"
              placeholder="Поиск по названию ЖК, району или пакету"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">Все категории</option>
              <option value="А">Категория А</option>
              <option value="Б">Категория Б</option>
            </select>
            <select className="select" value={housingFilter} onChange={(e) => setHousingFilter(e.target.value)}>
              <option value="">Любой класс жилья</option>
              {housingOptions.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
            <label className="switch">
              <input type="checkbox" checked={onlySelected} onChange={(e) => setOnlySelected(e.target.checked)} />
              Только выбранные
            </label>
            <span className="spacer" />
            <button type="button" className="btn btn--sm btn--soft" onClick={selectVisible} disabled={!visible.length}>
              Выбрать все найденные
            </button>
            {selectedCount > 0 && (
              <button type="button" className="btn btn--sm btn--ghost" onClick={clearAll}>
                Очистить
              </button>
            )}
          </div>

          {visible.length === 0 ? (
            <div className="card empty">По заданным условиям ЖК не найдены. Снимите фильтры или выберите другой город.</div>
          ) : view === 'map' ? (
            <ComplexMap
              complexes={visible}
              selection={selection}
              blocked={blocked}
              format={format}
              months={monthsCount}
              onToggle={(id) => {
                const complex = dataset.complexes.find((c) => c.id === id);
                if (complex) toggleComplex(complex);
              }}
              fitKey={`${activeCities.join(',')}|${categoryFilter}|${housingFilter}|${search}|${onlySelected}`}
            />
          ) : (
            <div className="cxlist">
              {visible.map((c) => (
                <ComplexRow
                  key={c.id}
                  complex={c}
                  format={format}
                  months={monthsCount}
                  selection={selection}
                  blocked={blocked.has(c.id)}
                  expanded={expanded.has(c.id)}
                  onToggle={() => toggleComplex(c)}
                  onToggleHouse={(address) => toggleHouse(c, address)}
                  onExpand={() => toggleExpanded(c.id)}
                />
              ))}
            </div>
          )}
        </section>

        <div className="note note--muted" style={{ marginBottom: 24 }}>
          Данные по сети: {fComplexes(dataset.totals.complexes)}, {fHouses(dataset.totals.houses)},{' '}
          {fScreens(dataset.totals.screens)}, {n(dataset.totals.residents)} жителей.
          Прайс — {money(fmt.pricePerScreenVat)} за экран в месяц с НДС ({money(fmt.pricePerScreenNoVat)} без НДС),
          период размещения — {dataset.periodDays} дней. Макет: {fmt.creative}.
        </div>
      </div>

      <aside className="panel">
        <SummaryPanel
          dataset={dataset}
          result={result}
          format={format}
          months={monthsCount}
          manager={manager}
          personal={personal}
          onPersonalChange={setPersonal}
          onRemove={(id) => setSelection((prev) => { const next = { ...prev }; delete next[id]; return next; })}
          onSave={() => setSaveOpen(true)}
        />
      </aside>

      {saveOpen && (
        <SaveQuoteDialog
          onClose={() => setSaveOpen(false)}
          payload={{
            format,
            months: monthsCount,
            selection,
            personalDiscounts: manager ? personal : undefined,
            advertiser: {
              company: '', contact: '', email: '', phone: '', comment: '',
              ...(initial ?? fromLink)?.advertiser,
              industry,
            },
          }}
          manager={manager}
        />
      )}
    </div>
  );
}
