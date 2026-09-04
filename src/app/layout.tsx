import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import Link from 'next/link';

import { Header } from '@/components/Header';
import { ManagerBar } from '@/components/ManagerBar';
import { dataset } from '@/lib/dataset';
import { n } from '@/lib/format';
import { IS_STATIC } from '@/lib/mode';
import { isManager } from '@/lib/session';

import './globals.css';

const roboto = Roboto({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
});

const THEME_SCRIPT = `try{var t=localStorage.getItem('zhk-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export const metadata: Metadata = {
  title: 'Умные экраны в ЖК — реклама в холлах и лифтах',
  description:
    'Digital-экраны в холлах и лифтах жилых комплексов в 14 городах России. Соберите медиаплан, посмотрите охват и стоимость без звонка менеджеру.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const manager = IS_STATIC ? false : await isManager();
  const { totals } = dataset;

  return (
    <html lang="ru" className={roboto.variable} suppressHydrationWarning>
      <head>
        {/* тема проставляется до первой отрисовки, иначе тёмная страница мигает белым */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        {manager && <ManagerBar />}

        <div className="topbar noprint">
          <div className="wrap">
            <span>Реклама на экранах в подъездах жилых комплексов</span>
            <span className="spacer" />
            <Link href="/coverage">Покрытие сети</Link>
            <Link href="/rules">Правила размещения</Link>
            {!IS_STATIC && <Link href="/manager">Вход для менеджера</Link>}
          </div>
        </div>

        <Header manager={manager} />
        <main>{children}</main>

        <footer className="footer noprint">
          <div className="wrap footer__cols">
            <div>
              <div className="strong" style={{ color: 'var(--ink)', fontSize: 16 }}>Умные экраны в ЖК</div>
              <div style={{ marginTop: 6 }}>Реклама в холлах и лифтах жилых комплексов</div>
              <div style={{ marginTop: 6 }}>
                {totals.cities} городов · {n(totals.complexes)} ЖК · {n(totals.screens)} экранов
              </div>
            </div>
            <div className="stack gap-6">
              <Link href="/calculator">Собрать медиаплан</Link>
              <Link href="/map">Карта размещения</Link>
              <Link href="/coverage">Покрытие сети</Link>
            </div>
            <div className="stack gap-6">
              <Link href="/requirements">Технические требования</Link>
              <Link href="/rules">Что нельзя размещать</Link>
              {!IS_STATIC && <Link href="/manager">Вход для менеджера</Link>}
            </div>
            <div className="stack gap-6">
              <span>Цены за месяц размещения ({dataset.periodDays} день)</span>
              <span>НДС {Math.round(dataset.vatRate * 100)}%</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
