'use client';

import { useEffect, useState } from 'react';

export const THEME_KEY = 'zhk-theme';

/**
 * Переключатель светлой и тёмной темы. По умолчанию берётся системная настройка,
 * явный выбор запоминается в браузере. Чтобы страница не мигала белым при загрузке,
 * атрибут data-theme проставляется скриптом в <head> ещё до первой отрисовки.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch { /* приватный режим */ }
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
      return;
    }
    setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* приватный режим */ }
  }

  const dark = theme === 'dark';

  return (
    <button
      type="button"
      className="themetoggle"
      onClick={toggle}
      title={dark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      aria-label={dark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      suppressHydrationWarning
    >
      {theme === null ? null : dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
