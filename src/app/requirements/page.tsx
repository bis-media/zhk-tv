import type { Metadata } from 'next';
import Link from 'next/link';

import { liveData as dataset } from '@/lib/live-dataset';
import { money } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Требования к макетам — Умные экраны в ЖК',
  description: 'Размеры баннера и основного экрана, форматы файлов, кодек и частота кадров.',
};

export default function RequirementsPage() {
  return (
    <div className="wrap" style={{ paddingTop: 36, maxWidth: 900 }}>
      <h1>Требования к рекламным материалам</h1>
      <p className="section__sub" style={{ marginTop: 12 }}>
        Экраны 4:3 работают без звука — вся информация должна читаться глазом за несколько секунд,
        пока человек идёт через холл или едет в лифте.
      </p>

      <div className="section grid-2">
        {(['banner', 'video'] as const).map((id) => {
          const f = dataset.formats[id];
          return (
            <div key={id} className="card card--pad stack gap-10">
              <h3>{f.title}</h3>
              <div className="row gap-8">
                <span className="chip chip--accent">{f.creative}</span>
                <span className="chip">{money(f.pricePerScreenVat)} / экран / мес.</span>
              </div>
              <p className="small muted">{f.description}</p>
            </div>
          );
        })}
      </div>

      <div className="section">
        <div className="card card--pad stack gap-12">
          <h3>Файлы</h3>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
            {dataset.tech.map((t) => <li key={t}>{t.replace(/^•\s*/, '')}</li>)}
          </ul>
          <div className="note note--muted">
            Ролик длиннее 10 секунд, вертикальные макеты и материалы со звуковой дорожкой,
            без которой ролик теряет смысл, к размещению не принимаются.
          </div>
        </div>
      </div>

      <div className="section">
        <div className="card card--pad row wrapline gap-16" style={{ alignItems: 'center' }}>
          <div>
            <h3>Макет готов?</h3>
            <p className="small muted" style={{ marginTop: 4 }}>Соберите медиаплан и отправьте ссылку менеджеру.</p>
          </div>
          <span className="spacer" />
          <Link href="/calculator" className="btn btn--lg">Собрать медиаплан</Link>
        </div>
      </div>
    </div>
  );
}
