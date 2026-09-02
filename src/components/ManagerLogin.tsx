'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ManagerLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch('/api/manager/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (!res.ok) {
      setError('Неверный пароль');
      return;
    }
    router.refresh();
    router.push('/calculator');
  }

  return (
    <form className="card card--pad stack gap-12" onSubmit={submit} style={{ maxWidth: 420 }}>
      <label className="field">
        <span>Пароль</span>
        <input
          className="input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && <div className="note note--danger">{error}</div>}
      <button className="btn" type="submit" disabled={busy || !password}>
        {busy ? 'Проверяем…' : 'Войти'}
      </button>
    </form>
  );
}
