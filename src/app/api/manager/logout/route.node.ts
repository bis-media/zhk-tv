import { NextResponse } from 'next/server';

import { MANAGER_COOKIE } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(MANAGER_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}
