import Link from 'next/link';

import { PrintButton } from './PrintButton';
import { calculate } from '@/lib/calc';
import { money, months as fMonths, n, percent } from '@/lib/format';
import type { Dataset, QuoteInput } from '@/lib/types';

interface Props {
  dataset: Dataset;
  quote: QuoteInput;
  /** показывать ли цену со скидкой */
  showDiscounts: boolean;
  discountGrid?: Record<string, number>;
  /** ссылка «Изменить расчёт» */
  editHref: string;
  /** номер расчёта, если он сохранён на сервере */
  number?: string;
  createdAt?: string;
}

export function QuoteView({ dataset, quote, showDiscounts, discountGrid, editHref, number, createdAt }: Props) {
  const result = calculate(dataset, {
    format: quote.format,
    months: quote.months,
    selection: quote.selection,
    discountGrid: showDiscounts ? discountGrid : undefined,
    personalDiscounts: showDiscounts ? quote.personalDiscounts : undefined,
  });

  const format = dataset.formats[quote.format];
  const { advertiser } = quote;
  const totals = result.totals;
  const price = showDiscounts ? result.finalVat : totals.vat;
  const created = createdAt
    ? new Date(createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  if (!result.lines.length) {
    return (
      <div className="wrap" style={{ paddingTop: 40 }}>
        <div className="card empty">
          Расчёт пустой или ссылка повреждена.{' '}
          <Link href="/calculator" style={{ color: 'var(--brand)' }}>Собрать заново</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ paddingTop: 32, paddingBottom: 32 }}>
      <div className="row wrapline gap-16" style={{ alignItems: 'flex-start' }}>
        <div>
          <div className="hero__eyebrow">
            Расчёт размещения{number ? ` № ${number}` : ''}
          </div>
          <h1 style={{ marginTop: 8, fontSize: 34 }}>
            {format.title}, {fMonths(quote.months)}
          </h1>
          <p className="muted" style={{ marginTop: 8 }}>
            {[created, advertiser.company, advertiser.industry].filter(Boolean).join(' · ')}
          </p>
        </div>
        <span className="spacer" />
        <div className="row gap-8 noprint">
          <PrintButton />
          <Link href={editHref} className="btn">Изменить расчёт</Link>
        </div>
      </div>

      <div className="section" style={{ paddingTop: 24 }}>
        <div className="metrics">
          <div className="metric">
            <div className="metric__value tabular">{n(result.lines.length)}</div>
            <div className="metric__label">жилых комплексов</div>
          </div>
          <div className="metric">
            <div className="metric__value tabular">{n(totals.houses)}</div>
            <div className="metric__label">домов</div>
          </div>
          <div className="metric">
            <div className="metric__value tabular">{n(totals.screens)}</div>
            <div className="metric__label">экранов</div>
          </div>
          <div className="metric">
            <div className="metric__value tabular">{n(totals.residents)}</div>
            <div className="metric__label">жителей в охвате</div>
          </div>
          <div className="metric">
            <div className="metric__value tabular">{n(totals.ots)}</div>
            <div className="metric__label">контактов за период</div>
          </div>
        </div>
      </div>

      <div className="section" style={{ paddingTop: 20 }}>
        <div className="card tablewrap">
          <table className="table">
            <thead>
              <tr>
                <th>Жилой комплекс</th>
                <th>Город</th>
                <th className="num">Домов</th>
                <th className="num">Экранов</th>
                <th className="num">Квартир</th>
                <th className="num">Жителей</th>
                <th className="num">OTS</th>
                <th className="num">Прайс, ₽</th>
                {showDiscounts && <th className="num">Скидка</th>}
                {showDiscounts && <th className="num">Итого, ₽</th>}
              </tr>
            </thead>
            <tbody>
              {result.lines.map((l) => (
                <tr key={l.complex.id}>
                  <td className="strong">
                    {l.complex.name}
                    {l.partial && (
                      <span className="muted"> · {l.houses} из {l.complex.housesList.length} домов</span>
                    )}
                  </td>
                  <td className="muted">{l.complex.city}</td>
                  <td className="num">{n(l.houses)}</td>
                  <td className="num">{n(l.screens)}</td>
                  <td className="num">{n(l.flats)}</td>
                  <td className="num">{n(l.residents)}</td>
                  <td className="num">{n(l.ots)}</td>
                  <td className="num">{n(l.vat)}</td>
                  {showDiscounts && <td className="num">{percent(1 - (l.vat ? l.finalVat / l.vat : 1), 1)}</td>}
                  {showDiscounts && <td className="num strong">{n(l.finalVat)}</td>}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>Итого</td>
                <td className="num">{n(totals.houses)}</td>
                <td className="num">{n(totals.screens)}</td>
                <td className="num">{n(totals.flats)}</td>
                <td className="num">{n(totals.residents)}</td>
                <td className="num">{n(totals.ots)}</td>
                <td className="num">{n(totals.vat)}</td>
                {showDiscounts && <td className="num">{percent(totals.vat ? 1 - result.finalVat / totals.vat : 0, 1)}</td>}
                {showDiscounts && <td className="num">{n(result.finalVat)}</td>}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="section" style={{ paddingTop: 20 }}>
        <div className="grid-2">
          <div className="card card--pad stack gap-10">
            <h3>Стоимость</h3>
            <div className="summary__line"><span>Формат</span><b>{format.title}</b></div>
            <div className="summary__line"><span>Макет</span><b>{format.creative}</b></div>
            <div className="summary__line"><span>Срок</span><b>{fMonths(quote.months)}</b></div>
            <div className="summary__line"><span>Экранов</span><b className="tabular">{n(totals.screens)}</b></div>
            <div className="summary__line"><span>Прайс без НДС</span><b className="tabular">{money(totals.noVat)}</b></div>
            <div className="summary__line"><span>Прайс с НДС</span><b className="tabular">{money(totals.vat)}</b></div>
            {showDiscounts && (
              <>
                <div className="summary__line"><span>Скидка</span><b className="tabular">−{money(result.saving)}</b></div>
                <div className="divider" />
              </>
            )}
            <div className="summary__total">
              <span className="small muted">{showDiscounts ? 'Итого с НДС' : 'Стоимость с НДС'}</span>
              <b>{money(price)}</b>
            </div>
            <div className="tiny muted">
              Стоимость 1000 контактов — {money(totals.ots ? (price / totals.ots) * 1000 : 0)}.
              {!showDiscounts && ' Цена по прайсу; итоговые условия подтверждает менеджер.'}
            </div>
          </div>

          <div className="card card--pad stack gap-10">
            <h3>Контакты по расчёту</h3>
            {advertiser.company || advertiser.contact || advertiser.email || advertiser.phone ? (
              <div className="stack gap-6 small">
                {advertiser.company && <div><span className="muted">Компания: </span>{advertiser.company}</div>}
                {advertiser.contact && <div><span className="muted">Контакт: </span>{advertiser.contact}</div>}
                {advertiser.email && <div><span className="muted">E-mail: </span>{advertiser.email}</div>}
                {advertiser.phone && <div><span className="muted">Телефон: </span>{advertiser.phone}</div>}
                {advertiser.comment && <div><span className="muted">Комментарий: </span>{advertiser.comment}</div>}
              </div>
            ) : (
              <p className="small muted">Контакты не указаны.</p>
            )}
            <div className="divider" />
            <p className="small muted">
              Ссылка на этот расчёт постоянная — её можно переслать коллегам или менеджеру.
              «Изменить расчёт» открывает калькулятор с этим набором ЖК; сохранение создаёт новую ссылку.
            </p>
            <Link href="/requirements" className="btn btn--soft noprint">Требования к макетам</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
