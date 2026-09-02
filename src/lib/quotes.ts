import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import type { QuoteInput, StoredQuote } from './types';

const DIR = process.env.QUOTES_DIR
  ? resolve(process.env.QUOTES_DIR)
  : join(process.cwd(), '.data', 'quotes');

const ID_RE = /^[a-z0-9]{10}$/;

function newId(): string {
  return randomBytes(8).toString('hex').slice(0, 10);
}

const fileFor = (id: string) => join(DIR, `${id}.json`);

export async function saveQuote(input: QuoteInput, createdBy: 'client' | 'manager'): Promise<StoredQuote> {
  await mkdir(DIR, { recursive: true });
  const quote: StoredQuote = {
    ...input,
    id: newId(),
    createdAt: new Date().toISOString(),
    createdBy,
  };
  await writeFile(fileFor(quote.id), JSON.stringify(quote, null, 2), 'utf8');
  return quote;
}

export async function loadQuote(id: string): Promise<StoredQuote | null> {
  if (!ID_RE.test(id)) return null;
  try {
    return JSON.parse(await readFile(fileFor(id), 'utf8')) as StoredQuote;
  } catch {
    return null;
  }
}

/* --------------------------------------------------------- валидация ----- */

const MAX_COMPLEXES = 400;

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.slice(0, max).trim() : '';
}

/** Приводит присланное клиентом тело к безопасной форме. Всё лишнее отбрасывается. */
export function sanitizeQuote(body: unknown): QuoteInput | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;

  const format = b.format === 'banner' ? 'banner' : 'video';
  const months = Math.min(24, Math.max(1, Math.round(Number(b.months) || 1)));

  const rawSelection = b.selection;
  if (!rawSelection || typeof rawSelection !== 'object') return null;

  const selection: QuoteInput['selection'] = {};
  let count = 0;
  for (const [key, value] of Object.entries(rawSelection as Record<string, unknown>)) {
    if (count++ >= MAX_COMPLEXES) break;
    if (typeof key !== 'string' || key.length > 200) continue;
    if (value === 'all') selection[key] = 'all';
    else if (Array.isArray(value)) {
      const addresses = value.filter((x): x is string => typeof x === 'string').slice(0, 200);
      if (addresses.length) selection[key] = addresses;
    }
  }
  if (!Object.keys(selection).length) return null;

  const a = (b.advertiser ?? {}) as Record<string, unknown>;
  const personal: Record<string, number> = {};
  if (b.personalDiscounts && typeof b.personalDiscounts === 'object') {
    for (const [key, value] of Object.entries(b.personalDiscounts as Record<string, unknown>)) {
      const pct = Number(value);
      if (Number.isFinite(pct) && pct > 0) personal[key.slice(0, 200)] = Math.min(100, pct);
    }
  }

  return {
    format,
    months,
    selection,
    advertiser: {
      company: str(a.company, 200),
      contact: str(a.contact, 200),
      email: str(a.email, 200),
      phone: str(a.phone, 60),
      industry: str(a.industry, 120),
      comment: str(a.comment, 2000),
    },
    personalDiscounts: Object.keys(personal).length ? personal : undefined,
    revealDiscounts: Boolean(b.revealDiscounts),
  };
}
