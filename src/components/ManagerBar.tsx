'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ManagerBar() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch('/api/manager/logout', { method: 'POST' });
    router.refresh();
  }

  return (
    <div className="mgrbar noprint">
      <div className="wrap">
        <span className="mgrbar__dot" />
        <span><b>Режим менеджера</b> — видны скидочная сетка и итоговая цена</span>
        <span className="spacer" />
        <button
          type="button"
          onClick={logout}
          disabled={busy}
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.3)', borderRadius: 7, padding: '3px 10px', cursor: 'pointer' }}
        >
          {busy ? 'Выходим…' : 'Выйти'}
        </button>
      </div>
    </div>
  );
}
