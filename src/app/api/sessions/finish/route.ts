/*
  Purpose: Finish (or create+finish) a session and store structured journal fields.
  POST body: { planId: string, taskKey: string, durationSec?: number, challenge?: string, breakthrough?: string }
  Behavior: Creates a Session row (or uses an existing ongoing one in future), sets endedAt, durationMins, challenge, breakthrough.
  Returns: { id: string }
*/
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const planId = (body?.planId || '').toString();
    const taskKey = (body?.taskKey || '').toString();
    const durationSec = typeof body?.durationSec === 'number' ? body.durationSec : undefined;
    const challenge = (body?.challenge || '').toString();
    const breakthrough = (body?.breakthrough || '').toString();
    if (!planId || !taskKey) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const plan = await prisma.plan.findFirst({ where: { id: planId, userId }, select: { id: true } });
    if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const endedAt = new Date();
    const durationMins = typeof durationSec === 'number' ? Math.max(1, Math.round(durationSec / 60)) : null;

    const session = await prisma.session.create({
      data: {
        userId,
        planId,
        taskKey,
        endedAt,
        durationMins: durationMins ?? undefined,
        challenge: challenge || undefined,
        breakthrough: breakthrough || undefined,
      },
      select: { id: true },
    });

    return NextResponse.json({ id: session.id });
  } catch (err) {
    console.error('[POST /api/sessions/finish] error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
