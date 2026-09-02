import type { Metadata } from 'next';
import Link from 'next/link';

import { dataset } from '@/lib/dataset';

export const metadata: Metadata = {
  title: 'Правила размещения — Умные экраны в ЖК',
  description: 'Стоп-лист тематик по ФЗ-38 «О рекламе» и правила для застройщиков.',
};

export default function RulesPage() {
  const developerCities = dataset.developerRules.rules.filter((r) => r.allowed);

  return (
    <div className="wrap" style={{ paddingTop: 36, maxWidth: 900 }}>
      <h1>Что можно и что нельзя размещать</h1>
      <p className="section__sub" style={{ marginTop: 12 }}>
        Экраны стоят в подъездах жилых домов, поэтому к рекламе применяются и закон
        «О рекламе» (№ 38-ФЗ), и договорённости с управляющими компаниями.
        Проверьте тематику до подготовки макета.
      </p>

      <div className="section">
        <div className="grid-2">
          {dataset.stopList.map((group) => (
            <div key={group.title} className="card card--pad stack gap-10">
              <h3>{group.title}</h3>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.75 }}>
                {group.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="card card--pad stack gap-12">
          <h3>Реклама застройщиков и недвижимости</h3>
          <p className="small muted">
            В большинстве ЖК собственники не допускают рекламу конкурирующих застройщиков
            на своих домах. Размещение возможно только в тех городах и категориях ЖК,
            где это согласовано:
          </p>
          <div className="tablewrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Регион</th>
                  <th>Город</th>
                  <th>Категория ЖК</th>
                </tr>
              </thead>
              <tbody>
                {developerCities.map((r) => (
                  <tr key={`${r.city}-${r.category}`}>
                    <td className="muted">{r.region}</td>
                    <td className="strong">{r.city}</td>
                    <td>{r.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="note note--muted">
            В калькуляторе достаточно выбрать тематику «Застройщик, агентство недвижимости» —
            недоступные ЖК будут отмечены и исключены из расчёта автоматически.
          </div>
        </div>
      </div>

      <div className="section">
        <div className="card card--pad row wrapline gap-16" style={{ alignItems: 'center' }}>
          <div>
            <h3>Тематика проходит?</h3>
            <p className="small muted" style={{ marginTop: 4 }}>Переходите к расчёту размещения.</p>
          </div>
          <span className="spacer" />
          <Link href="/calculator" className="btn btn--lg">Собрать медиаплан</Link>
        </div>
      </div>
    </div>
  );
}
