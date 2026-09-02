/**
 * Расчёт, упакованный в саму ссылку — для статической сборки, где нет бэкенда.
 *
 * JSON → gzip (если браузер умеет) → base64url. Набор ЖК хорошо сжимается:
 * ключи начинаются с одинаковых «Регион|Город|», поэтому даже сотня комплексов
 * укладывается в короткий адрес.
 */

import type { QuoteInput } from './types';

const GZIP = 'z';
const PLAIN = 'j';

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
}

async function squeeze(bytes: Uint8Array, format: 'gzip'): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new CompressionStream(format));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function expand(bytes: Uint8Array, format: 'gzip'): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream(format));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function encodeQuote(quote: QuoteInput): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(quote));
  if (typeof CompressionStream !== 'undefined') {
    try {
      return GZIP + toBase64Url(await squeeze(json, 'gzip'));
    } catch { /* браузер без сжатия — кодируем как есть */ }
  }
  return PLAIN + toBase64Url(json);
}

export async function decodeQuote(value: string): Promise<QuoteInput | null> {
  try {
    const kind = value.slice(0, 1);
    const bytes = fromBase64Url(value.slice(1));
    const json = kind === GZIP
      ? new TextDecoder().decode(await expand(bytes, 'gzip'))
      : new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as QuoteInput;
    if (!parsed || typeof parsed !== 'object' || !parsed.selection) return null;
    return parsed;
  } catch {
    return null;
  }
}
