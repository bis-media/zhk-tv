import type { Metadata } from 'next';
import Link from 'next/link';

import { liveData as dataset } from '@/lib/live-dataset';
import { n } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Покрытие сети — Умные экраны в ЖК',
  description: 'Все города и жилые комплексы сети: дома, экраны, квартиры и жители.',
};

export default function CoveragePage() {
  const byCity = new Map<string, typeof dataset.complexes>();
  for (const c of dataset.complexes) {
    const list = byCity.get(c.city) ?? [];
    list.push(c);
    byCity.set(c.city, list);
  }

  return (
    <div className="wrap" style={{ paddingTop: 36 }}>
      <h1>Покрытие сети</h1>
      <p className="section__sub" style={{ marginTop: 12 }}>
        {n(dataset.totals.complexes)} жилых комплексов, {n(dataset.totals.houses)} домов и{' '}
        {n(dataset.totals.screens)} экранов в {dataset.totals.cities} городах.
        Категория ЖК влияет на условия размещения, класс жилья — на аудиторию дома.
      </p>

      <div className="section">
        <div className="card tablewrap">
          <table className="table">
            <thead>
              <tr>
                <th>Город</th>
                <th>Регион</th>
                <th className="num">ЖК</th>
                <th className="num">Домов</th>
                <th className="num">Экранов</th>
                <th className="num">Квартир</th>
                <th className="num">Жителей</th>
              </tr>
            </thead>
            <tbody>
              {dataset.cities.map((c) => (
                <tr key={c.name}>
                  <td className="strong">{c.name}</td>
                  <td className="muted">{c.region}</td>
                  <td className="num">{n(c.complexes)}</td>
                  <td className="num">{n(c.houses)}</td>
                  <td className="num">{n(c.screens)}</td>
                  <td className="num">{n(c.flats)}</td>
                  <td className="num">{n(c.residents)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>Всего</td>
                <td className="num">{n(dataset.totals.complexes)}</td>
                <td className="num">{n(dataset.totals.houses)}</td>
                <td className="num">{n(dataset.totals.screens)}</td>
                <td className="num">{n(dataset.totals.flats)}</td>
                <td className="num">{n(dataset.totals.residents)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {dataset.cities.map((city) => {
        const list = (byCity.get(city.name) ?? []).slice().sort((a, b) => b.screens - a.screens);
        return (
          <section className="section" key={city.name}>
            <div className="section__head">
              <div>
                <h2>{city.name}</h2>
                <p className="section__sub">
                  {city.region} · {n(city.complexes)} ЖК · {n(city.screens)} экранов · {n(city.residents)} жителей
                </p>
              </div>
              <Link href="/calculator" className="btn btn--ghost">Выбрать ЖК</Link>
            </div>

            <div className="card tablewrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Жилой комплекс</th>
                    <th>Район</th>
                    <th>Пакет</th>
                    <th>Класс</th>
                    <th>Кат.</th>
                    <th className="num">Домов</th>
                    <th className="num">Экранов</th>
                    <th className="num">Квартир</th>
                    <th className="num">Жителей</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id}>
                      <td className="strong">{c.name}</td>
                      <td className="muted">{c.district || '—'}</td>
                      <td className="muted">{c.pack || '—'}</td>
                      <td className="muted">{c.housing || '—'}</td>
                      <td>{c.category}</td>
                      <td className="num">{n(c.houses)}</td>
                      <td className="num">{n(c.screens)}</td>
                      <td className="num">{n(c.flats)}</td>
                      <td className="num">{n(c.residents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
