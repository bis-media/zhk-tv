'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/calculator', label: 'Медиаплан' },
  { href: '/map', label: 'Карта' },
  { href: '/coverage', label: 'Покрытие', small: true },
  { href: '/requirements', label: 'Требования к макетам', small: true },
  { href: '/rules', label: 'Правила размещения', small: true },
];

export function Header({ manager }: { manager: boolean }) {
  const pathname = usePathname();

  return (
    <header className="header noprint">
      <div className="wrap header__inner">
        <Link href="/" className="logo">
          <span className="logo__mark">ЖК</span>
          <span>
            Умные экраны
            <span className="logo__sub">реклама в жилых комплексах</span>
          </span>
        </Link>

        <nav className="nav">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={l.small ? 'hide-sm' : undefined}
              data-active={pathname === l.href}
            >
              {l.label}
            </Link>
          ))}
          {!manager && (
            <Link href="/calculator" className="btn btn--sm" style={{ marginLeft: 8 }}>
              Рассчитать
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
