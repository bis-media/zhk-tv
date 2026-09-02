'use client';

import { useState } from 'react';

import { BASE_PATH, IS_STATIC } from '@/lib/mode';
import { encodeQuote } from '@/lib/quotelink';
import type { QuoteInput } from '@/lib/types';

interface Props {
  payload: Omit<QuoteInput, 'revealDiscounts'>;
  manager: boolean;
  onClose: () => void;
}

export function SaveQuoteDialog({ payload, manager, onClose }: Props) {
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [reveal, setReveal] = useState(manager);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const quote: QuoteInput = {
        ...payload,
        revealDiscounts: manager ? reveal : false,
        advertiser: { ...payload.advertiser, company, contact, email, phone, comment },
      };

      // в статической сборке бэкенда нет — расчёт целиком кодируется в ссылку
      if (IS_STATIC) {
        const code = await encodeQuote(quote);
        setUrl(new URL(`${BASE_PATH}/quote/?d=${encodeURIComponent(code)}`, window.location.origin).toString());
        return;
      }

      const res = await fetch(`${BASE_PATH}/api/quotes`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(quote),
      });
      if (!res.ok) throw new Error('save failed');
      const data = (await res.json()) as { url: string };
      setUrl(new URL(data.url, window.location.origin).toString());
    } catch {
      setError('Не удалось сохранить расчёт. Попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* буфер недоступен — ссылку можно выделить руками */ }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="card card--pad modal stack gap-16"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {url ? (
          <>
            <h3>Расчёт сохранён</h3>
            <p className="small muted">
              Ссылка открывает этот медиаплан целиком: состав ЖК, охват и стоимость.
              Её можно отправить коллегам или менеджеру — расчёт не потеряется.
            </p>
            <div className="copyfield">
              <input className="input" readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
              <button type="button" className="btn" onClick={copy}>{copied ? 'Скопировано' : 'Копировать'}</button>
            </div>
            <div className="row gap-8">
              <a className="btn btn--ghost" href={url}>Открыть расчёт</a>
              <span className="spacer" />
              <button type="button" className="btn btn--ghost" onClick={onClose}>Закрыть</button>
            </div>
          </>
        ) : (
          <>
            <h3>Сохранить расчёт</h3>
            <p className="small muted">
              Контакты нужны, чтобы менеджер понимал, с кем обсуждать бронь. Обязательных полей нет —
              ссылку можно получить и без них.
            </p>

            <div className="grid-2">
              <label className="field">
                <span>Компания</span>
                <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} />
              </label>
              <label className="field">
                <span>Контактное лицо</span>
                <input className="input" value={contact} onChange={(e) => setContact(e.target.value)} />
              </label>
              <label className="field">
                <span>E-mail</span>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="field">
                <span>Телефон</span>
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
            </div>

            <label className="field">
              <span>Комментарий</span>
              <textarea className="textarea" value={comment} onChange={(e) => setComment(e.target.value)} />
            </label>

            {manager && (
              <label className="switch">
                <input type="checkbox" checked={reveal} onChange={(e) => setReveal(e.target.checked)} />
                Показать клиенту цену со скидкой (иначе по ссылке будет виден только прайс)
              </label>
            )}

            {error && <div className="note note--danger">{error}</div>}

            <div className="row gap-8">
              <button type="button" className="btn" onClick={submit} disabled={busy}>
                {busy ? 'Сохраняем…' : 'Получить ссылку'}
              </button>
              <button type="button" className="btn btn--ghost" onClick={onClose}>Отмена</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
