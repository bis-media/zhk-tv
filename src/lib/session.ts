import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const MANAGER_COOKIE = 'zhk_manager';
const TTL_MS = 12 * 60 * 60 * 1000; // смена менеджера

function secret(): string {
  return process.env.SESSION_SECRET || 'dev-secret-change-me';
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function issueToken(): string {
  const exp = String(Date.now() + TTL_MS);
  return `${exp}.${sign(exp)}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [exp, mac] = token.split('.');
  if (!exp || !mac) return false;
  if (Number(exp) < Date.now()) return false;
  const expected = sign(exp);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function checkPassword(input: string): boolean {
  const expected = process.env.MANAGER_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(String(input));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Проверка сессии менеджера в серверных компонентах. */
export async function isManager(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(MANAGER_COOKIE)?.value);
}
