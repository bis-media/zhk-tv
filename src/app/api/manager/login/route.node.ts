import { NextResponse } from 'next/server';

import { MANAGER_COOKIE, checkPassword, issueToken } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let password = '';
  try {
    const body = (await request.json()) as { password?: unknown };
    password = typeof body.password === 'string' ? body.password : '';
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }

  if (!checkPassword(password)) {
    return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(MANAGER_COOKIE, issueToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 12 * 60 * 60,
  });
  return response;
}
