import Link from 'next/link';

import { liveData as dataset } from '@/lib/live-dataset';
import { money, n } from '@/lib/format';

export default function HomePage() {
  const { totals, formats, cities } = dataset;
  const top = cities.slice(0, 6);

  return (
    <>
      <section className="wrap hero">
        <div className="hero__eyebrow">Digital-реклама в жилых комплексах</div>
        <h1 style={{ marginTop: 10, maxWidth: 820 }}>
          Экраны в холлах и лифтах — реклама там, где человек проходит каждый день
        </h1>
        <div className="hero__actions" style={{ marginTop: 32 }}>
          <Link href="/calculator" className="btn btn--lg">Собрать медиаплан</Link>
          <Link href="/map" className="btn btn--lg btn--ghost">Показать на карте</Link>
        </div>
      </section>

      <section className="wrap">
        <div className="metrics">
          <div className="metric">
            <div className="metric__value tabular">{n(totals.screens)}</div>
            <div className="metric__label">экранов в сети</div>
          </div>
          <div className="metric">
            <div className="metric__value tabular">{n(totals.complexes)}</div>
            <div className="metric__label">жилых комплексов</div>
          </div>
          <div className="metric">
            <div className="metric__value tabular">{n(totals.houses)}</div>
            <div className="metric__label">домов</div>
          </div>
          <div className="metric">
            <div className="metric__value tabular">{n(totals.residents)}</div>
            <div className="metric__label">жителей в охвате</div>
          </div>
          <div className="metric">
            <div className="metric__value tabular">{n(totals.flats)}</div>
            <div className="metric__label">квартир</div>
          </div>
        </div>
      </section>

      <section className="wrap section">
        <div className="section__head">
          <div>
            <h2>Два формата на одном экране</h2>
            <p className="section__sub">
              Экран 4:3 в холле или лифте работает без звука: ролик крутится в блоке,
              генеральный баннер держится в верхней части экрана весь эфир.
            </p>
          </div>
        </div>

        <div className="grid-2">
          {(['video', 'banner'] as const).map((id) => {
            const f = formats[id];
            return (
              <div key={id} className="card card--pad stack gap-10">
                <div className="row gap-8">
                  <h3>{f.title}</h3>
                  <span className="spacer" />
                  <span className="chip">{f.creative}</span>
                </div>
                <p className="muted small">{f.description}</p>
                <div className="divider" />
                <div className="row gap-8" style={{ alignItems: 'baseline' }}>
                  <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>
                    {money(f.pricePerScreenVat)}
                  </span>
                  <span className="small muted">за экран в месяц, с НДС</span>
                </div>
                <div className="tiny muted">{money(f.pricePerScreenNoVat)} без НДС · период размещения {dataset.periodDays} дней</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="wrap section">
        <div className="section__head">
          <div>
            <h2>Как собрать размещение</h2>
            <p className="section__sub">
              Четыре шага вместо переписки с менеджером и пересылки таблицы.
            </p>
          </div>
        </div>

        <div className="grid-2">
          <div className="card card--pad steps">
            {[
              ['Выберите формат и срок', 'Ролик 10 секунд или генеральный баннер, от одного месяца.'],
              ['Отметьте города и ЖК', 'Фильтры по категории ЖК, классу жилья и району. Можно взять весь город, а можно отдельные дома.'],
              ['Посмотрите цифры', 'Экраны, квартиры, жители, контакты за период и стоимость 1000 контактов пересчитываются на лету.'],
              ['Сохраните ссылку', 'Расчёт получает постоянный адрес — отправьте его коллегам или менеджеру для брони и скидки.'],
            ].map(([title, text]) => (
              <div className="step" key={title}>
                <span className="step__num" />
                <span>
                  <b>{title}</b>
                  <div className="small muted" style={{ marginTop: 2 }}>{text}</div>
                </span>
              </div>
            ))}
          </div>

          <div className="card card--pad stack gap-12">
            <h3>Что видно по каждому ЖК</h3>
            <p className="small muted">
              Данные по сети собраны по домам, поэтому охват не задваивается,
              когда в доме стоят экраны и в холле, и в лифте.
            </p>
            <div className="summary__grid">
              <div className="summary__cell"><b>Адреса домов</b><span>с годом сдачи и этажностью</span></div>
              <div className="summary__cell"><b>Экраны</b><span>отдельно в холлах и лифтах</span></div>
              <div className="summary__cell"><b>Квартиры и жители</b><span>охват по дому</span></div>
              <div className="summary__cell"><b>OTS и CPT</b><span>контакты и цена за 1000</span></div>
            </div>
            <Link href="/coverage" className="btn btn--soft">Открыть список ЖК</Link>
          </div>
        </div>
      </section>

      <section className="wrap section">
        <div className="section__head">
          <div>
            <h2>География сети</h2>
            <p className="section__sub">Пять регионов, {totals.cities} городов — от миллионников до подмосковных ЖК.</p>
          </div>
          <Link href="/coverage" className="btn btn--ghost">Все города</Link>
        </div>

        <div className="grid-3">
          {top.map((c) => (
            <div key={c.name} className="card card--pad stack gap-6">
              <div className="row gap-8">
                <b>{c.name}</b>
                <span className="spacer" />
                <span className="chip">{c.region}</span>
              </div>
              <div className="small muted">
                {n(c.complexes)} ЖК · {n(c.houses)} домов · {n(c.screens)} экранов
              </div>
              <div className="small muted">{n(c.residents)} жителей в охвате</div>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap section">
        <div className="grid-2">
          <div className="card card--pad stack gap-10">
            <h3>Требования к макетам</h3>
            <ul className="small muted" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
              {dataset.tech.slice(0, 4).map((t) => <li key={t}>{t}</li>)}
            </ul>
            <Link href="/requirements" className="btn btn--soft">Все технические требования</Link>
          </div>

          <div className="card card--pad stack gap-10">
            <h3>Что нельзя размещать</h3>
            <p className="small muted">
              Жилой дом — чувствительная среда, часть тематик закрыта законом «О рекламе»
              и договорами с управляющими компаниями. Проверьте свою тематику заранее.
            </p>
            <div className="row wrapline gap-6">
              {dataset.stopList.flatMap((g) => g.items).slice(0, 8).map((item) => (
                <span key={item} className="chip chip--danger">{item}</span>
              ))}
            </div>
            <Link href="/rules" className="btn btn--soft">Полный стоп-лист</Link>
          </div>
        </div>
      </section>

      <section className="wrap section" style={{ paddingBottom: 8 }}>
        <div className="block-orange row wrapline gap-20" style={{ alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#fff' }}>Готовы посчитать?</h2>
            <p style={{ marginTop: 10, maxWidth: 560 }}>
              Выберите ЖК списком или на карте — охват, контакты и стоимость посчитаются сами.
              Расчёт сохраняется по постоянной ссылке, её можно переслать коллегам или менеджеру.
            </p>
          </div>
          <span className="spacer" />
          <div className="row gap-12 wrapline">
            <Link href="/calculator" className="btn btn--lg">Собрать медиаплан</Link>
            <Link href="/map" className="btn btn--lg btn--plain">Открыть карту</Link>
          </div>
        </div>
      </section>
    </>
  );
}
