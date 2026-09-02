import type { Complex, Dataset, FormatId, House, Selection } from './types';

/* ------------------------------------------------------------- выборка --- */

export function selectedHouses(complex: Complex, selection: Selection): House[] {
  const picked = selection[complex.id];
  if (!picked) return [];
  if (picked === 'all') return complex.housesList;
  const set = new Set(picked);
  return complex.housesList.filter((h) => set.has(h.address));
}

export function isComplexSelected(complex: Complex, selection: Selection): boolean {
  return Boolean(selection[complex.id]);
}

export function isFullySelected(complex: Complex, selection: Selection): boolean {
  const picked = selection[complex.id];
  return picked === 'all' || (Array.isArray(picked) && picked.length === complex.housesList.length);
}

/* ------------------------------------------------------------- расчёты --- */

export interface LineTotals {
  houses: number;
  screens: number;
  flats: number;
  residents: number;
  showsPerDay: number;
  /** OTS за весь период размещения */
  ots: number;
  /** прайс без НДС за весь период */
  noVat: number;
  /** прайс с НДС за весь период */
  vat: number;
}

export interface ComplexLine extends LineTotals {
  complex: Complex;
  partial: boolean;
  /** категорийная скидка, доля 0..1 — только для режима менеджера */
  categoryDiscount: number;
  /** персональная скидка, проценты 0..100 */
  personalDiscount: number;
  /** цена с НДС после категорийной скидки */
  discountedVat: number;
  /** цена с НДС после категорийной и персональной скидок */
  finalVat: number;
}

export const emptyTotals = (): LineTotals => ({
  houses: 0, screens: 0, flats: 0, residents: 0, showsPerDay: 0, ots: 0, noVat: 0, vat: 0,
});

function houseTotals(houses: House[], format: FormatId, months: number): LineTotals {
  const t = emptyTotals();
  for (const h of houses) {
    const m = format === 'video' ? h.video : h.banner;
    t.houses += 1;
    t.screens += h.screens;
    t.flats += h.flats;
    t.residents += h.residents;
    t.showsPerDay += format === 'video' ? h.showsPerDay : 0;
    t.ots += m.ots * months;
    t.noVat += m.noVat * months;
    t.vat += m.vat * months;
  }
  return t;
}

export function categoryDiscount(
  grid: Record<string, number> | undefined,
  complex: Complex,
): number {
  if (!grid) return 0;
  return grid[`${complex.category}|${complex.tier}`] ?? 0;
}

export interface CalcOptions {
  format: FormatId;
  months: number;
  selection: Selection;
  /** сетка категорийных скидок — передаётся только менеджеру */
  discountGrid?: Record<string, number>;
  /** персональные скидки, id ЖК -> %, ключ '*' — на весь расчёт */
  personalDiscounts?: Record<string, number>;
}

export interface CalcResult {
  lines: ComplexLine[];
  totals: LineTotals;
  /** сумма с НДС после категорийных скидок */
  discountedVat: number;
  /** сумма с НДС после всех скидок */
  finalVat: number;
  /** экономия относительно прайса */
  saving: number;
  /** стоимость 1000 контактов по прайсу */
  cpt: number;
  /** стоимость 1000 контактов по итоговой цене */
  cptFinal: number;
  cities: string[];
}

export function calculate(dataset: Dataset, options: CalcOptions): CalcResult {
  const { format, months, selection, discountGrid, personalDiscounts } = options;
  const globalPersonal = personalDiscounts?.['*'] ?? 0;

  const lines: ComplexLine[] = [];
  const totals = emptyTotals();

  for (const complex of dataset.complexes) {
    const houses = selectedHouses(complex, selection);
    if (!houses.length) continue;

    const t = houseTotals(houses, format, months);
    const catDiscount = categoryDiscount(discountGrid, complex);
    const personal = personalDiscounts?.[complex.id] ?? globalPersonal;
    const discountedVat = Math.round(t.vat * (1 - catDiscount));
    const finalVat = Math.round(discountedVat * (1 - clampPercent(personal) / 100));

    lines.push({
      ...t,
      complex,
      partial: houses.length < complex.housesList.length,
      categoryDiscount: catDiscount,
      personalDiscount: personal,
      discountedVat,
      finalVat,
    });

    totals.houses += t.houses;
    totals.screens += t.screens;
    totals.flats += t.flats;
    totals.residents += t.residents;
    totals.showsPerDay += t.showsPerDay;
    totals.ots += t.ots;
    totals.noVat += t.noVat;
    totals.vat += t.vat;
  }

  lines.sort((a, b) =>
    a.complex.city.localeCompare(b.complex.city, 'ru') ||
    a.complex.name.localeCompare(b.complex.name, 'ru'));

  const discountedVat = lines.reduce((a, l) => a + l.discountedVat, 0);
  const finalVat = lines.reduce((a, l) => a + l.finalVat, 0);
  const cities = [...new Set(lines.map((l) => l.complex.city))];

  return {
    lines,
    totals,
    discountedVat,
    finalVat,
    saving: totals.vat - finalVat,
    cpt: totals.ots ? (totals.vat / totals.ots) * 1000 : 0,
    cptFinal: totals.ots ? (finalVat / totals.ots) * 1000 : 0,
    cities,
  };
}

export const clampPercent = (v: number) => Math.min(100, Math.max(0, Number.isFinite(v) ? v : 0));

/* ------------------------------------------------------- застройщики ----- */

/** Разрешена ли реклама застройщика в этом ЖК (скрытая вкладка исходной таблицы). */
export function developerAllowed(dataset: Dataset, complex: Complex): boolean {
  const rule = dataset.developerRules.rules.find(
    (r) => r.city === complex.city && r.category === complex.category,
  );
  return rule ? rule.allowed : dataset.developerRules.defaultAllowed;
}

/* ----------------------------------------------------------- проверки ---- */

export function countSelected(selection: Selection): number {
  return Object.keys(selection).length;
}
