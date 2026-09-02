import { NextResponse } from 'next/server';

import { sanitizeQuote, saveQuote } from '@/lib/quotes';
import { isManager } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }

  const input = sanitizeQuote(body);
  if (!input) return NextResponse.json({ error: 'пустой или некорректный расчёт' }, { status: 400 });

  const manager = await isManager();
  if (!manager) {
    // скидки может проставлять только менеджер
    input.personalDiscounts = undefined;
    input.revealDiscounts = false;
  }

  const quote = await saveQuote(input, manager ? 'manager' : 'client');
  return NextResponse.json({ id: quote.id, url: `/q/${quote.id}` }, { status: 201 });
}
