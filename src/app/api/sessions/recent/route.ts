/*
  Purpose: Return recent sessions for a plan, including journal fields.
  GET params: planId (required), limit (optional, default 3)
  Returns: { sessions: Array<{ id, taskKey, challenge, breakthrough, durationMins, startedAt, endedAt }> }
*/
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const planId = (searchParams.get('planId') || '').toString();
    const limitRaw = searchParams.get('limit');
    const limit = Math.max(1, Math.min(10, Number(limitRaw ?? 3) || 3));

    if (!planId) return NextResponse.json({ error: 'Missing planId' }, { status: 400 });

    const plan = await prisma.plan.findFirst({ where: { id: planId, userId }, select: { id: true } });
    if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const sessions = await prisma.session.findMany({
      where: { userId, planId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, taskKey: true, challenge: true, breakthrough: true, durationMins: true, startedAt: true, endedAt: true },
    });

    return NextResponse.json({ sessions });
  } catch (err) {
    console.error('[GET /api/sessions/recent] error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
